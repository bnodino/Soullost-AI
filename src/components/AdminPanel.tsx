import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Users,
  Sliders,
  BarChart3,
  History,
  Save,
  RotateCcw,
  Search,
  Check,
  AlertTriangle,
  Lock,
  Trash2,
  UserCheck,
  UserX,
  Sparkles,
  Bot,
  Plus,
  Edit2,
  RefreshCw,
  Globe,
  ImageIcon,
  Brain,
  ShieldAlert,
  Megaphone,
  CheckCircle2,
  Loader2,
  Upload,
  CreditCard,
  Layers,
  BookOpen,
  Mic,
  Paperclip,
  Sun,
  Eye,
  EyeOff,
  LayoutGrid,
  MessageSquare,
  Key,
} from "lucide-react";
import {
  UserProfile,
  GlobalAdminConfig,
  ActivityLog,
  CustomStarterPrompt,
  SubscriptionPlan,
  AppVersion,
} from "../types";
import { FruitflyIcon } from "./FruitflyIcon";
import {
  saveGlobalConfig,
  updateUserByAdmin,
  deleteUserByAdmin,
  subscribeToAllUsers,
  subscribeToActivityLogs,
  subscribeToSubscriptions,
  subscribeToVersions,
  DEFAULT_GLOBAL_CONFIG,
  SUPER_ADMIN_EMAIL,
} from "../lib/firebase";
import { optimizeLogoImage } from "../lib/imageOptimizer";
import { AdminSubscriptionsTab } from "./admin/AdminSubscriptionsTab";
import { AdminVersionsTab } from "./admin/AdminVersionsTab";
import { AdminApiKeysTab } from "./admin/AdminApiKeysTab";
import { AdminUserSubscriptionModal } from "./admin/AdminUserSubscriptionModal";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile | null;
  globalConfig: GlobalAdminConfig;
  onConfigUpdated?: (newConfig: GlobalAdminConfig) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  globalConfig,
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    "users" | "subscriptions" | "versions" | "apiKeys" | "customization" | "analytics" | "logs"
  >("users");

  // Subscriptions & Versions state
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [managingSubUser, setManagingSubUser] = useState<UserProfile | null>(null);

  // Local draft of A to Z config
  const [draftConfig, setDraftConfig] = useState<GlobalAdminConfig>({ ...globalConfig });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Activity logs
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Starter prompt editor modal state
  const [editingPrompt, setEditingPrompt] = useState<CustomStarterPrompt | null>(null);
  const [isNewPrompt, setIsNewPrompt] = useState(false);
  const [isOptimizingLogo, setIsOptimizingLogo] = useState(false);

  useEffect(() => {
    setDraftConfig({ ...globalConfig });
  }, [globalConfig]);

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to users
    const unsubUsers = subscribeToAllUsers((userList) => {
      setUsers(userList);
    });

    // Subscribe to subscriptions
    const unsubSubs = subscribeToSubscriptions((plans) => {
      setSubscriptions(plans);
    });

    // Subscribe to versions
    const unsubVers = subscribeToVersions((vers) => {
      setVersions(vers);
    });

    // Subscribe to logs
    const unsubLogs = subscribeToActivityLogs((logList) => {
      setLogs(logList);
    });

    return () => {
      unsubUsers();
      unsubSubs();
      unsubVers();
      unsubLogs();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin =
    currentUserProfile?.role === "admin" ||
    currentUserProfile?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const adminEmail = currentUserProfile?.email || SUPER_ADMIN_EMAIL;
      let finalConfig = { ...draftConfig };

      // Ensure customLogoUrl is not a giant base64 payload
      if (
        finalConfig.customLogoUrl &&
        finalConfig.customLogoUrl.startsWith("data:") &&
        finalConfig.customLogoUrl.length > 50 * 1024
      ) {
        try {
          finalConfig.customLogoUrl = await optimizeLogoImage(finalConfig.customLogoUrl, 256, 80 * 1024);
          setDraftConfig(finalConfig);
        } catch (optErr) {
          console.warn("Could not optimize custom logo before saving:", optErr);
        }
      }

      await saveGlobalConfig(finalConfig, adminEmail);
      onConfigUpdated?.(finalConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save config error:", err);
      setSaveError(err.message || "Failed to save settings.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all A-to-Z app settings to system defaults?")) {
      setDraftConfig({
        ...DEFAULT_GLOBAL_CONFIG,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserProfile?.email || "admin",
      });
    }
  };

  const handleToggleUserRole = async (targetUser: UserProfile) => {
    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert("Super admin role cannot be modified.");
      return;
    }
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (confirm(`Change role for ${targetUser.email} to ${newRole.toUpperCase()}?`)) {
      await updateUserByAdmin(
        targetUser.uid,
        { role: newRole },
        currentUserProfile?.email || "admin"
      );
    }
  };

  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert("Super admin cannot be suspended or banned.");
      return;
    }
    const newStatus = targetUser.status === "active" ? "banned" : "active";
    if (confirm(`${newStatus === "banned" ? "Ban" : "Activate"} user ${targetUser.email}?`)) {
      await updateUserByAdmin(
        targetUser.uid,
        { status: newStatus },
        currentUserProfile?.email || "admin"
      );
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert("Cannot delete the primary administrator.");
      return;
    }
    if (confirm(`Permanently delete user ${targetUser.email} from Firestore? This cannot be undone.`)) {
      await deleteUserByAdmin(
        targetUser.uid,
        targetUser.email,
        currentUserProfile?.email || "admin"
      );
    }
  };

  // Starter Prompts manipulation
  const handleSavePrompt = (prompt: CustomStarterPrompt) => {
    let updatedList = [...(draftConfig.starterPrompts || [])];
    if (isNewPrompt) {
      updatedList.push(prompt);
    } else {
      updatedList = updatedList.map((p) => (p.id === prompt.id ? prompt : p));
    }
    setDraftConfig({ ...draftConfig, starterPrompts: updatedList });
    setEditingPrompt(null);
  };

  const handleDeletePrompt = (id: string) => {
    const filtered = (draftConfig.starterPrompts || []).filter((p) => p.id !== id);
    setDraftConfig({ ...draftConfig, starterPrompts: filtered });
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchQuery && matchRole && matchStatus;
  });

  return (
    <div
      id="soullost-admin-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="soullost-admin-panel"
        className="w-full max-w-6xl h-[92vh] flex flex-col bg-white dark:bg-[#15171d] rounded-[32px] border border-[#E0E0E0] dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] dark:border-neutral-800 bg-[#F8F9FA] dark:bg-[#1a1c23]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#A4C639] to-[#81A618] text-white flex items-center justify-center font-bold text-base shadow-xs">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#1F1F1F] dark:text-white">
                  Soul Lost Admin Command Center
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#A4C639]/20 text-[#5f7d0e] dark:text-[#A4C639]">
                  SuperAdmin Mode
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                A to Z System Customization & Real-time User Database Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-6 border-b border-[#E0E0E0] dark:border-neutral-800 bg-white dark:bg-[#181a20]">
          <div className="flex gap-1 overflow-x-auto py-2">
            <button
              id="admin-tab-users"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "users"
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Users size={15} />
              <span>Users & Subscriptions ({users.length})</span>
            </button>

            <button
              id="admin-tab-subscriptions"
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "subscriptions"
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <CreditCard size={15} />
              <span>Subscriptions ({subscriptions.length})</span>
            </button>

            <button
              id="admin-tab-versions"
              onClick={() => setActiveTab("versions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "versions"
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Layers size={15} />
              <span>App Versions ({versions.length})</span>
            </button>

            <button
              id="admin-tab-apikeys"
              onClick={() => setActiveTab("apiKeys")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "apiKeys"
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Key size={15} />
              <span>API Key Pool & Auto-Failover</span>
            </button>

            <button
              id="admin-tab-customization"
              onClick={() => setActiveTab("customization")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "customization"
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Sliders size={15} />
              <span>A to Z Customization</span>
            </button>

            <button
              id="admin-tab-analytics"
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <BarChart3 size={15} />
              <span>Telemetry & Health</span>
            </button>

            <button
              id="admin-tab-logs"
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === "logs"
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <History size={15} />
              <span>Audit Logs ({logs.length})</span>
            </button>
          </div>

          {activeTab === "customization" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-neutral-200 hover:bg-black/5 transition cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                id="admin-save-config-btn"
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#A4C639] hover:bg-[#92b230] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSavingConfig ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                <span>Save All Changes</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Feedback notification */}
        {saveSuccess && (
          <div className="px-6 py-2 bg-emerald-500 text-white text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              Settings saved! All changes are now live for all visitors via Firestore.
            </span>
          </div>
        )}

        {saveError && (
          <div className="px-6 py-2 bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle size={15} />
            <span>{saveError}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA]/60 dark:bg-[#131418]">
          {/* TAB 1: ALL USER DATA */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#181a20] p-4 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by email, name, or UID..."
                    className="w-full pl-9 pr-4 py-2 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-xs text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-xs font-medium text-[#444746] dark:text-neutral-300 outline-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins Only</option>
                    <option value="user">Regular Users</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-xs font-medium text-[#444746] dark:text-neutral-300 outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-[#181a20] rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E0E0E0] dark:border-neutral-800 bg-[#F0F4F9] dark:bg-[#1d2028] text-[11px] font-bold uppercase tracking-wider text-[#444746] dark:text-neutral-400">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Subscription</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Messages</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4">Last Login</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F4F9] dark:divide-neutral-800 text-xs">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400 dark:text-neutral-500">
                            No registered users found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSuper = u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                          return (
                            <tr
                              key={u.uid}
                              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[#D3E3FD] text-[#041E49] font-bold text-xs flex items-center justify-center flex-shrink-0">
                                    {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-[#1F1F1F] dark:text-white flex items-center gap-1.5">
                                      <span>{u.displayName || "Anonymous"}</span>
                                      {isSuper && (
                                        <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-bold">
                                          Super
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
                                      {u.email}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-mono truncate max-w-[140px]">
                                      UID: {u.uid}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    u.role === "admin"
                                      ? "bg-[#A4C639]/25 text-[#5f7d0e] dark:text-[#A4C639]"
                                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                  }`}
                                >
                                  {u.role === "admin" ? <Shield size={11} /> : null}
                                  {u.role.toUpperCase()}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[11px] capitalize text-[#1A73E8]">
                                      {u.subscriptionTier || "free"}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                        u.subscriptionStatus === "active" || u.subscriptionStatus === "lifetime"
                                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                          : u.subscriptionStatus === "trial"
                                          ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                                          : "bg-gray-100 dark:bg-neutral-800 text-gray-500"
                                      }`}
                                    >
                                      {u.subscriptionStatus || "active"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {u.subscriptionExpiresAt && u.subscriptionStatus !== "lifetime"
                                      ? `Exp: ${new Date(u.subscriptionExpiresAt).toLocaleDateString()}`
                                      : "Permanent"}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    u.status === "active"
                                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                      : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  {u.status.toUpperCase()}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 font-mono text-[#1F1F1F] dark:text-neutral-300">
                                {u.totalMessages || 0} msgs
                              </td>

                              <td className="py-3.5 px-4 text-gray-500 dark:text-neutral-400 text-[11px]">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                              </td>

                              <td className="py-3.5 px-4 text-gray-500 dark:text-neutral-400 text-[11px]">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Manage Subscription */}
                                  <button
                                    onClick={() => setManagingSubUser(u)}
                                    title="Set up / Manage User Subscription"
                                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#1A73E8] hover:text-blue-700 transition cursor-pointer"
                                  >
                                    <CreditCard size={14} />
                                  </button>

                                  {/* Toggle Admin */}
                                  <button
                                    onClick={() => handleToggleUserRole(u)}
                                    disabled={isSuper}
                                    title={u.role === "admin" ? "Demote to Regular User" : "Promote to Admin"}
                                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#444746] dark:text-neutral-300 hover:text-blue-600 transition cursor-pointer disabled:opacity-30"
                                  >
                                    <Shield size={14} />
                                  </button>

                                  {/* Toggle Ban */}
                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    disabled={isSuper}
                                    title={u.status === "active" ? "Ban user" : "Unban user"}
                                    className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-30 ${
                                      u.status === "active"
                                        ? "hover:bg-red-50 text-gray-500 hover:text-red-600"
                                        : "hover:bg-emerald-50 text-red-500 hover:text-emerald-600"
                                    }`}
                                  >
                                    {u.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                                  </button>

                                  {/* Delete user */}
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    disabled={isSuper}
                                    title="Delete user data"
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 transition cursor-pointer disabled:opacity-30"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION PLANS & PRICING ENGINE */}
          {activeTab === "subscriptions" && (
            <AdminSubscriptionsTab
              plans={subscriptions}
              adminEmail={currentUserProfile?.email || SUPER_ADMIN_EMAIL}
            />
          )}

          {/* TAB 3: APP RELEASES & MODEL VERSIONS */}
          {activeTab === "versions" && (
            <AdminVersionsTab
              versions={versions}
              adminEmail={currentUserProfile?.email || SUPER_ADMIN_EMAIL}
            />
          )}

          {/* TAB: MULTI-KEY POOL & AUTO-FAILOVER ROTATION */}
          {activeTab === "apiKeys" && <AdminApiKeysTab />}

          {/* TAB 4: A TO Z APP CUSTOMIZATION */}
          {activeTab === "customization" && (
            <div className="space-y-6">
              {/* SECTION 1: BRANDING & IDENTITY */}
              <div className="bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E0E0E0] dark:border-neutral-800">
                  <Sparkles size={18} className="text-[#81A618]" />
                  <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white uppercase tracking-wider">
                    A. Brand Identity & Visual Copy
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Application Name
                    </label>
                    <input
                      type="text"
                      value={draftConfig.appName}
                      onChange={(e) => setDraftConfig({ ...draftConfig, appName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Logo & Brand Accent Color (HEX)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftConfig.logoAccentColor}
                        onChange={(e) => setDraftConfig({ ...draftConfig, logoAccentColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={draftConfig.logoAccentColor}
                        onChange={(e) => setDraftConfig({ ...draftConfig, logoAccentColor: e.target.value })}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-sm font-mono text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      App Tagline & Header Description
                    </label>
                    <input
                      type="text"
                      value={draftConfig.tagline}
                      onChange={(e) => setDraftConfig({ ...draftConfig, tagline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                    />
                  </div>

                  {/* Custom Logo Manager */}
                  <div className="md:col-span-2 p-4 rounded-xl bg-neutral-50 dark:bg-[#14151a] border border-[#E0E0E0] dark:border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-[#1F1F1F] dark:text-white block">
                          Application Logo
                        </label>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                          Upload your custom logo image (PNG, SVG, JPG, WebP) or paste an image URL. If unset, Soul Lost's default icon is displayed.
                        </p>
                      </div>
                      {draftConfig.customLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setDraftConfig({ ...draftConfig, customLogoUrl: "" })}
                          className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Reset to Default Icon
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Logo Preview */}
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-neutral-800 border border-dashed border-gray-300 dark:border-neutral-700 shadow-2xs overflow-hidden shrink-0">
                        {draftConfig.customLogoUrl ? (
                          <img
                            src={draftConfig.customLogoUrl}
                            alt="Logo preview"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = "0.4";
                            }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                            style={{ backgroundColor: draftConfig.logoAccentColor || "#A4C639" }}
                          >
                            <FruitflyIcon size={22} />
                          </div>
                        )}
                      </div>

                      {/* URL input and File upload button */}
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://example.com/logo.png or upload image file..."
                            value={draftConfig.customLogoUrl || ""}
                            onChange={(e) => setDraftConfig({ ...draftConfig, customLogoUrl: e.target.value })}
                            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-white dark:bg-[#1c1e24] text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                          />
                          <label className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition shrink-0 ${
                            isOptimizingLogo
                              ? "bg-gray-100 dark:bg-neutral-800 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-[#E9EEF6] dark:bg-neutral-800 hover:bg-[#deecfa] text-[#041E49] dark:text-[#D3E3FD] border-[#D3E3FD] dark:border-neutral-700"
                          }`}>
                            {isOptimizingLogo ? (
                              <>
                                <Loader2 size={14} className="animate-spin text-[#A4C639]" />
                                <span>Optimizing...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={14} />
                                <span>Upload Image</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isOptimizingLogo}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setIsOptimizingLogo(true);
                                    // Automatically compress & resize to max 256px (<80KB)
                                    const optimizedDataUrl = await optimizeLogoImage(file, 256, 80 * 1024);
                                    setDraftConfig({ ...draftConfig, customLogoUrl: optimizedDataUrl });
                                  } catch (err: any) {
                                    alert("Could not process logo: " + (err.message || "Unknown error"));
                                  } finally {
                                    setIsOptimizingLogo(false);
                                    e.target.value = "";
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 flex items-center gap-1">
                          {draftConfig.customLogoUrl ? (
                            <>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Custom logo active</span>
                              {draftConfig.customLogoUrl.startsWith("data:") && (
                                <span className="text-gray-400">
                                  ({Math.round(draftConfig.customLogoUrl.length * 0.75 / 1024)} KB · Auto-optimized)
                                </span>
                              )}
                              <span>— Applied across Header, Sidebar, and Welcome banner.</span>
                            </>
                          ) : (
                            "Default Soul Lost vector icon is active."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Welcome Screen Big Headline
                    </label>
                    <input
                      type="text"
                      value={draftConfig.welcomeHeadline}
                      onChange={(e) => setDraftConfig({ ...draftConfig, welcomeHeadline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Welcome Screen Subtitle Prompt
                    </label>
                    <input
                      type="text"
                      value={draftConfig.welcomeSubtitle}
                      onChange={(e) => setDraftConfig({ ...draftConfig, welcomeSubtitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: AI BRAIN & MODEL ENGINE CONTROLS */}
              <div className="bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E0E0E0] dark:border-neutral-800">
                  <Bot size={18} className="text-blue-500" />
                  <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white uppercase tracking-wider">
                    B. AI Models, Reasoning & Hyperparameters
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Default AI Model
                    </label>
                    <select
                      value={draftConfig.defaultModel}
                      onChange={(e) => setDraftConfig({ ...draftConfig, defaultModel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                    >
                      <option value="fruitfly-plus">Soul Lost Plus (Fast Answer — Ultra-fast, low latency)</option>
                      <option value="fruitfly-pro-lite">Soul Lost Pro-Lite (Medium Research — Balanced search & reasoning)</option>
                      <option value="fruitfly-pro">Soul Lost Pro (Deep Search — Advanced STEM & deep investigation)</option>
                      <option value="fruitfly-image-studio">Soul Lost Image Studio (Generative Canvas)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Default Deep Reasoning / Thinking Budget
                    </label>
                    <select
                      value={draftConfig.defaultThinkingLevel}
                      onChange={(e) => setDraftConfig({ ...draftConfig, defaultThinkingLevel: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639]"
                    >
                      <option value="HIGH">High (Maximum deep thought before response)</option>
                      <option value="LOW">Low (Balanced reasoning speed)</option>
                      <option value="MINIMAL">Minimal</option>
                      <option value="OFF">Disabled</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300">
                        Model Temperature (Creativity)
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600">{draftConfig.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={draftConfig.temperature}
                      onChange={(e) => setDraftConfig({ ...draftConfig, temperature: parseFloat(e.target.value) })}
                      className="w-full cursor-pointer accent-[#A4C639]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>0.0 (Strict & Precise)</span>
                      <span>0.7 (Standard)</span>
                      <span>1.5 (High Creative)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300">
                        Max Output Tokens
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600">{draftConfig.maxOutputTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="1024"
                      max="16384"
                      step="512"
                      value={draftConfig.maxOutputTokens}
                      onChange={(e) => setDraftConfig({ ...draftConfig, maxOutputTokens: parseInt(e.target.value) })}
                      className="w-full cursor-pointer accent-[#A4C639]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>1,024</span>
                      <span>8,192</span>
                      <span>16,384</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Global System Persona & Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={draftConfig.systemInstruction}
                      onChange={(e) => setDraftConfig({ ...draftConfig, systemInstruction: e.target.value })}
                      placeholder="Instructions sent to Soul Lost AI for all responses..."
                      className="w-full p-3 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-xs text-[#1F1F1F] dark:text-white leading-relaxed outline-none focus:border-[#A4C639]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: ANTI-BOT ATTACK & SECURITY */}
              <div className="bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E0E0E0] dark:border-neutral-800">
                  <ShieldAlert size={18} className="text-red-500" />
                  <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white uppercase tracking-wider">
                    C. Anti-Bot Defense & Google Captcha Policies
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] cursor-pointer hover:border-[#A4C639]">
                    <input
                      type="checkbox"
                      checked={draftConfig.requireCaptchaLogin}
                      onChange={(e) => setDraftConfig({ ...draftConfig, requireCaptchaLogin: e.target.checked })}
                      className="mt-0.5 rounded text-[#A4C639] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#1F1F1F] dark:text-white block">
                        Google Captcha on Login
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                        Require anti-bot checkbox before user login
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] cursor-pointer hover:border-[#A4C639]">
                    <input
                      type="checkbox"
                      checked={draftConfig.requireCaptchaRegister}
                      onChange={(e) => setDraftConfig({ ...draftConfig, requireCaptchaRegister: e.target.checked })}
                      className="mt-0.5 rounded text-[#A4C639] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#1F1F1F] dark:text-white block">
                        Google Captcha on Registration
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                        Block bot account mass-creation attacks
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] cursor-pointer hover:border-[#A4C639]">
                    <input
                      type="checkbox"
                      checked={draftConfig.maintenanceMode}
                      onChange={(e) => setDraftConfig({ ...draftConfig, maintenanceMode: e.target.checked })}
                      className="mt-0.5 rounded text-red-500 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 block">
                        Maintenance Mode
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                        Suspend visitor prompts for updates
                      </span>
                    </div>
                  </label>
                </div>

                {draftConfig.maintenanceMode && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-red-600 block">
                      Maintenance Notice to Display
                    </label>
                    <input
                      type="text"
                      value={draftConfig.maintenanceMessage}
                      onChange={(e) => setDraftConfig({ ...draftConfig, maintenanceMessage: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-xs text-red-800 dark:text-red-300 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* SECTION 4: STARTER PROMPTS A-Z CUSTOMIZATION */}
              <div className="bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0] dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white uppercase tracking-wider">
                      D. Welcome Screen Starter Cards
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPrompt(true);
                      setEditingPrompt({
                        id: "prompt-" + Date.now(),
                        title: "New Category",
                        description: "Short description of prompt task...",
                        prompt: "Enter the full prompt sent to Soul Lost AI here...",
                        icon: "Sparkles",
                        isImage: false,
                        useSearch: false,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#A4C639]/20 hover:bg-[#A4C639]/30 text-[#5f7d0e] dark:text-[#A4C639] text-xs font-bold transition cursor-pointer"
                  >
                    <Plus size={14} /> Add Starter Card
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(draftConfig.starterPrompts || []).map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#1F1F1F] dark:text-white">
                            {p.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsNewPrompt(false);
                                setEditingPrompt(p);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 cursor-pointer"
                              title="Edit prompt"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePrompt(p.id)}
                              className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                              title="Delete prompt"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-[10px]">
                        {p.isImage && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-semibold">
                            Image Studio
                          </span>
                        )}
                        {p.useSearch && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold">
                            Web Search
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: BROADCAST ANNOUNCEMENT BANNER */}
              <div className="bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E0E0E0] dark:border-neutral-800">
                  <Megaphone size={18} className="text-indigo-500" />
                  <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white uppercase tracking-wider">
                    E. Global Announcement Alert Banner
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] cursor-pointer hover:border-[#A4C639]">
                    <input
                      type="checkbox"
                      checked={draftConfig.announcementActive}
                      onChange={(e) => setDraftConfig({ ...draftConfig, announcementActive: e.target.checked })}
                      className="mt-0.5 rounded text-[#A4C639] focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#1F1F1F] dark:text-white block">
                        Show Announcement
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                        Display persistent banner at top
                      </span>
                    </div>
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Banner Type / Color
                    </label>
                    <select
                      value={draftConfig.announcementType}
                      onChange={(e) => setDraftConfig({ ...draftConfig, announcementType: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-xs text-[#1F1F1F] dark:text-white outline-none"
                    >
                      <option value="info">Info (Blue Clean)</option>
                      <option value="warning">Warning (Amber)</option>
                      <option value="success">Success (Soul Lost Lime)</option>
                      <option value="critical">Critical Alert (Red)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-3">
                    <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                      Announcement Text Content
                    </label>
                    <input
                      type="text"
                      value={draftConfig.announcementText}
                      onChange={(e) => setDraftConfig({ ...draftConfig, announcementText: e.target.value })}
                      placeholder="e.g. Soul Lost v2.5 released with deep thinking and live Google Grounding!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D3D3] dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] text-xs text-[#1F1F1F] dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: BUTTON VISIBILITY & NAVIGATION CONTROLS (SHOW / HIDE EVERY BUTTON) */}
              <div className="bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E0E0E0] dark:border-neutral-800 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#A4C639]/15 text-[#5f7d0e] dark:text-[#A4C639] flex items-center justify-center">
                      <LayoutGrid size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white uppercase tracking-wider">
                        F. Button & Interface Control Center
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Admin can set up, hide, or remove every button in Soul Lost (e.g. Images, Notebooks, Web Search).
                      </p>
                    </div>
                  </div>

                  {/* Quick bulk actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraftConfig({
                          ...draftConfig,
                          showImagesButton: true,
                          showNotebookButton: true,
                          showWebSearchButton: true,
                          showThinkButton: true,
                          showVoiceButton: true,
                          showUploadButton: true,
                          showAttachButton: true,
                          showMemoryButton: true,
                          showUpgradeButton: true,
                          showShareButton: true,
                          showClearAllButton: true,
                          showLibraryButton: true,
                          showSearchChatsButton: true,
                          showNewChatButton: true,
                          showDeleteChatButton: true,
                          showThemeButton: true,
                          showModelSelector: true,
                          showEnhanceButton: true,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Show All
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftConfig({
                          ...draftConfig,
                          showImagesButton: false,
                          showNotebookButton: false,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
                    >
                      Hide Images & Notebooks
                    </button>
                  </div>
                </div>

                {/* Sub-group 1: Sidebar & Primary Navigation */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-[#444746] dark:text-neutral-300 uppercase tracking-wider block">
                    1. Sidebar & Primary Navigation Buttons
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Images Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950/50 text-pink-600 flex items-center justify-center">
                          <ImageIcon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Images / Studio Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showImagesButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showImagesButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Sidebar Images tab & Image Studio generation
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showImagesButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showImagesButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Notebook Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Notebook Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showNotebookButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showNotebookButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Sidebar Notebooks & scratchpad editor
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showNotebookButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showNotebookButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* New Chat Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                          <Plus size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              New Chat Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showNewChatButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showNewChatButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Sidebar top primary new chat action
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showNewChatButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showNewChatButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Search Chats Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                          <Search size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Search Chats Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showSearchChatsButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showSearchChatsButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Sidebar search dialog for finding chats
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showSearchChatsButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showSearchChatsButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Library Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
                          <Layers size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Library Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showLibraryButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showLibraryButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Saved conversations and pinned sessions
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showLibraryButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showLibraryButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Memory / Intelligence Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                          <Brain size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Personal Memory Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showMemoryButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showMemoryButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Custom instructions & context memory
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showMemoryButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showMemoryButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Chat Delete Trash Icon Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
                          <Trash2 size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Chat Delete Icon (with Yes/No Popup)
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showDeleteChatButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showDeleteChatButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Delete icon on chat items with Yes/No popup
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showDeleteChatButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showDeleteChatButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Clear All Chats Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center">
                          <Trash2 size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Clear All Chats Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showClearAllButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showClearAllButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Clear all conversations option in settings
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showClearAllButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showClearAllButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sub-group 2: Chat Input Tools */}
                <div className="space-y-2.5 pt-2 border-t border-[#E0E0E0] dark:border-neutral-800">
                  <span className="text-xs font-bold text-[#444746] dark:text-neutral-300 uppercase tracking-wider block">
                    2. Chat Input Tools & Mode Switches
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Web Search Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                          <Globe size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Web Search Grounding Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showWebSearchButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showWebSearchButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Real-time live Google Search in chat input
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showWebSearchButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showWebSearchButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Thinking Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                          <Brain size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Deep Thinking / Reasoning Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showThinkButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showThinkButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Thinking level toggle in chat input
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showThinkButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showThinkButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Voice Mic Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                          <Mic size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Voice Input / Microphone Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showVoiceButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showVoiceButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Voice speech-to-text dictation
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showVoiceButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showVoiceButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Upload / Attach File Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 flex items-center justify-center">
                          <Paperclip size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Upload & Attachment (+) Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showUploadButton !== false && draftConfig.showAttachButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showUploadButton !== false && draftConfig.showAttachButton !== false
                                ? "Visible"
                                : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Upload photos, files, and documents
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showUploadButton !== false && draftConfig.showAttachButton !== false}
                          onChange={(e) =>
                            setDraftConfig({
                              ...draftConfig,
                              showUploadButton: e.target.checked,
                              showAttachButton: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Prompt Enhancer Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 flex items-center justify-center">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Prompt Enhancer Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showEnhanceButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showEnhanceButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Magic sparkle to expand & enrich prompt
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showEnhanceButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showEnhanceButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sub-group 3: Header & Top Actions */}
                <div className="space-y-2.5 pt-2 border-t border-[#E0E0E0] dark:border-neutral-800">
                  <span className="text-xs font-bold text-[#444746] dark:text-neutral-300 uppercase tracking-wider block">
                    3. Header & Global UI Buttons
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Upgrade Pill Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Upgrade Pill Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showUpgradeButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showUpgradeButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Upgrade button in top header & sidebar
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showUpgradeButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showUpgradeButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* Dark/Light Mode Theme Toggle Button */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                          <Sun size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              Theme Toggle Button
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showThemeButton !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showThemeButton !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Quick Sun / Moon toggle in header
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showThemeButton !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showThemeButton: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>

                    {/* AI Model Dropdown Selector */}
                    <div className="p-3.5 rounded-xl border border-[#E0E0E0] dark:border-neutral-800 bg-neutral-50 dark:bg-[#15161c] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-600 flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1F1F] dark:text-white">
                              AI Model Selector Dropdown
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                draftConfig.showModelSelector !== false
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              }`}
                            >
                              {draftConfig.showModelSelector !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Model picker pill next to Soul Lost header logo
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showModelSelector !== false}
                          onChange={(e) =>
                            setDraftConfig({ ...draftConfig, showModelSelector: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A4C639]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEMETRY & HEALTH */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-[#E0E0E0] dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                    <Users size={18} className="text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-[#1F1F1F] dark:text-white">
                    {users.length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Firestore registered accounts
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-[#E0E0E0] dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Administrators</span>
                    <Shield size={18} className="text-[#81A618]" />
                  </div>
                  <div className="text-2xl font-black text-[#1F1F1F] dark:text-white">
                    {users.filter((u) => u.role === "admin").length}
                  </div>
                  <div className="text-[11px] text-gray-500 font-semibold mt-1">
                    Includes superadmin
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-[#E0E0E0] dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Exchanged</span>
                    <Bot size={18} className="text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-[#1F1F1F] dark:text-white">
                    {users.reduce((acc, curr) => acc + (curr.totalMessages || 0), 0)}
                  </div>
                  <div className="text-[11px] text-gray-500 font-semibold mt-1">
                    User prompts & replies
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#181a20] border border-[#E0E0E0] dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 dark:text-neutral-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">System Status</span>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    100% Operational
                  </div>
                  <div className="text-[11px] text-gray-500 font-semibold mt-1">
                    Firebase & AI Intelligence Engine
                  </div>
                </div>
              </div>

              {/* Infrastructure Diagnostic Status Cards */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181a20] border border-[#E0E0E0] dark:border-neutral-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#444746] dark:text-neutral-300">
                  Infrastructure Health Check
                </h3>
                <div className="divide-y divide-[#F0F4F9] dark:divide-neutral-800 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#1F1F1F] dark:text-white">
                      Google Firebase Authentication
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 font-bold">
                      Connected (Google & Email/Pass Active)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#1F1F1F] dark:text-white">
                      Cloud Firestore Database
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 font-bold">
                      Synced (Database ID: ai-studio-soullost)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#1F1F1F] dark:text-white">
                      Generative Multimodal AI Engine
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 font-bold">
                      Online (Ultra-Fast 2.5 Flash, 2.5 Pro & Studio Imagen)
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#1F1F1F] dark:text-white">
                      Anti-Bot Google Captcha Defense
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 font-bold">
                      Active (Protecting Auth & Inputs)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#181a20] rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-[#E0E0E0] dark:border-neutral-800 bg-[#F0F4F9] dark:bg-[#1d2028] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#444746] dark:text-neutral-400">
                    Security & Activity Audit Log
                  </span>
                  <span className="text-[11px] text-gray-500">Live stream</span>
                </div>
                <div className="divide-y divide-[#F0F4F9] dark:divide-neutral-800 text-xs">
                  {logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No admin activity recorded yet.
                    </div>
                  ) : (
                    logs.map((l) => (
                      <div key={l.id} className="p-3.5 flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-neutral-200 dark:bg-neutral-800 text-[#1F1F1F] dark:text-neutral-200">
                              {l.action}
                            </span>
                            <span className="font-semibold text-[#1F1F1F] dark:text-white">
                              {l.actorEmail}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-neutral-400 text-xs">
                            {l.details}
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 flex-shrink-0">
                          {new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal for editing a starter prompt */}
        {editingPrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-[#181a20] rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="font-bold text-sm text-[#1F1F1F] dark:text-white">
                  {isNewPrompt ? "Add Starter Card" : "Edit Starter Card"}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPrompt(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Card Title</label>
                  <input
                    type="text"
                    value={editingPrompt.title}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                    className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Card Description</label>
                  <input
                    type="text"
                    value={editingPrompt.description}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                    className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Full Prompt Text</label>
                  <textarea
                    rows={3}
                    value={editingPrompt.prompt}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                    className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPrompt.isImage}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, isImage: e.target.checked })}
                    />
                    <span>Image Studio Prompt</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPrompt.useSearch}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, useSearch: e.target.checked })}
                    />
                    <span>Search Grounding Prompt</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingPrompt(null)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePrompt(editingPrompt)}
                  className="px-4 py-1.5 rounded-full bg-[#A4C639] hover:bg-[#92b230] text-white text-xs font-bold cursor-pointer"
                >
                  Save Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for managing user subscription */}
        {managingSubUser && (
          <AdminUserSubscriptionModal
            user={managingSubUser}
            plans={subscriptions}
            adminEmail={currentUserProfile?.email || SUPER_ADMIN_EMAIL}
            onClose={() => setManagingSubUser(null)}
            onSuccess={(updated) => {
              setUsers((prev) =>
                prev.map((u) => (u.uid === updated.uid ? updated : u))
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
