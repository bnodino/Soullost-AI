import React, { useState, useRef, useEffect } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Gem,
  HelpCircle,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  LogIn,
  LogOut,
  MapPin,
  MessageSquare,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PieChart,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Shield,
  Smile,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { ChatSession, UserProfile, GlobalAdminConfig } from "../types";
import { FruitflyIcon } from "./FruitflyIcon";
import { SUPER_ADMIN_EMAIL } from "../lib/firebase";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: "login" | "register") => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
  globalConfig?: GlobalAdminConfig;
  theme?: "dark" | "light";
  onSetTheme?: (t: "dark" | "light") => void;
  onToggleImageMode?: () => void;
  onOpenUpgrade?: () => void;
  activePage?: string;
  onNavigate?: (page: string) => void;
  onOpenSearchChats?: () => void;
  onOpenImportMemory?: () => void;
  onOpenExportMemory?: () => void;
  onOpenFeedback?: () => void;
  onOpenLocationModal?: () => void;
  userLocation?: string;
}

// Sample recent chats matching the reference image if user has no saved sessions
const DEFAULT_RECENT_TITLES = [
  "E-commerce Full-Stack System Prompt",
  "Funny Multiplayer Game Ideas",
  "ওয়েব লার্নিংয়ে লোডিং অ্যানিমেশন যুক্তকরণ",
  "Building Free AI Solutions",
  "Netlify-তে রুম জয়েন না হওয়ার সমাধান",
  "HTML Multiplayer Blob Game",
  "HTML Game Download Portal",
  "ই-কমার্স প্রোডাক্ট ফিচার যুক্তকরণ",
  "HTML E-commerce Website Template",
  'E-commerce Platform Blueprint for "E...',
  "Zopia Embossed Logo Abstract Macro",
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onClearAll,
  onOpenSettings,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onSignOut,
  globalConfig,
  theme = "light",
  onSetTheme,
  onToggleImageMode,
  onOpenUpgrade,
  activePage = "chat",
  onNavigate,
  onOpenSearchChats,
  onOpenImportMemory,
  onOpenExportMemory,
  onOpenFeedback,
  onOpenLocationModal,
  userLocation = "Batiaghata, Bangladesh",
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [themeSubmenuOpen, setThemeSubmenuOpen] = useState(false);
  const [sessionPendingDelete, setSessionPendingDelete] = useState<ChatSession | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  // Close settings popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(e.target as Node)
      ) {
        setSettingsMenuOpen(false);
        setThemeSubmenuOpen(false);
      }
    };
    if (settingsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsMenuOpen]);

  const startRename = (s: ChatSession) => {
    setEditingId(s.id);
    setEditingTitle(s.title);
  };

  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  // Filter chats by search query
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredSessions = trimmedQuery
    ? sessions.filter((s) => s.title.toLowerCase().includes(trimmedQuery))
    : sessions;

  const displayName = currentUser?.displayName || "Jibon Islam";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container matching Gemini UI */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-[260px] bg-[#F0F4F9] dark:bg-[#181a20] border-r border-[#E5E7EB] dark:border-neutral-800 flex flex-col justify-between transition-transform duration-200 ease-in-out select-none md:static ${
          isOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-full md:hidden"
        }`}
      >
        {/* Top Header Row & Main Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Bar: Sparkle Logo + Soul Lost Name + Collapse Sidebar Icon */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={onNewChat}
            >
              {globalConfig?.customLogoUrl ? (
                <img
                  src={globalConfig.customLogoUrl}
                  alt={globalConfig?.appName || "Soul Lost"}
                  className="w-5 h-5 rounded-md object-cover"
                />
              ) : (
                <FruitflyIcon size={22} />
              )}
              <span className="text-[17px] font-normal tracking-tight text-[#1F1F1F] dark:text-[#E3E3E3]">
                {globalConfig?.appName || "Soul Lost"}
              </span>
            </div>

            {/* Collapse Sidebar Icon Button (matches reference icon) */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="Collapse menu"
              aria-label="Collapse sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="4" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="px-2.5 space-y-0.5 pt-1">
            {/* New Chat Button */}
            {globalConfig?.showNewChatButton !== false && (
              <button
                onClick={() => {
                  onNewChat();
                  onNavigate?.("chat");
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                  activePage === "chat"
                    ? "bg-[#E2E7ED] dark:bg-neutral-800 text-[#1F1F1F] dark:text-white"
                    : "text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800"
                }`}
              >
                <Edit3 size={17} className="text-[#444746] dark:text-neutral-400" />
                <span>New chat</span>
              </button>
            )}

            {/* Search Chats Button */}
            {globalConfig?.showSearchChatsButton !== false && (
              <button
                onClick={() => {
                  onOpenSearchChats?.();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <Search size={17} className="text-[#444746] dark:text-neutral-400" />
                <span>Search chats</span>
              </button>
            )}

            {/* Images Button */}
            {globalConfig?.showImagesButton !== false && (
              <button
                onClick={() => {
                  onNavigate?.("images");
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                  activePage === "images"
                    ? "bg-[#E2E7ED] dark:bg-neutral-800 text-[#1F1F1F] dark:text-white"
                    : "text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800"
                }`}
              >
                <ImageIcon size={17} className="text-[#444746] dark:text-neutral-400" />
                <span>Images</span>
              </button>
            )}

            {/* Library Button */}
            {globalConfig?.showLibraryButton !== false && (
              <button
                onClick={() => {
                  onNavigate?.("library");
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                  activePage === "library"
                    ? "bg-[#E2E7ED] dark:bg-neutral-800 text-[#1F1F1F] dark:text-white"
                    : "text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800"
                }`}
              >
                <LayoutGrid size={17} className="text-[#444746] dark:text-neutral-400" />
                <span>Library</span>
              </button>
            )}
          </div>

          {/* Notebooks Section */}
          {globalConfig?.showNotebookButton !== false && (
            <div className="px-2.5 pt-4 pb-1">
              <div className="px-3 pb-1 text-xs text-[#5F6368] dark:text-neutral-400 font-medium">
                Notebooks
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onNavigate?.("notebook");
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                    activePage === "notebook"
                      ? "bg-[#E2E7ED] dark:bg-neutral-800 text-[#1F1F1F] dark:text-white"
                      : "text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800"
                  }`}
                >
                  <Plus size={15} className="text-gray-500" />
                  <span>New notebook</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate?.("notebook");
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-full text-xs font-medium text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <BookOpen size={15} className="text-gray-500" />
                  <span>Untitled notebook</span>
                </button>
              </div>
            </div>
          )}

          {/* Recents Section */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pt-2">
            <div className="px-3 pb-1 text-xs text-[#5F6368] dark:text-neutral-400 font-medium">
              Recents
            </div>

            <div className="space-y-0.5 pb-3">
              {/* Show actual user sessions if available */}
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId;
                  const isEditing = editingId === session.id;

                  return (
                    <div
                      key={session.id}
                      className={`group relative flex items-center justify-between rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        isCurrent
                          ? "bg-[#E2E7ED] dark:bg-neutral-800 text-[#1F1F1F] dark:text-white"
                          : "text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename(session.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-white dark:bg-neutral-800 border border-[#4285F4] rounded px-2 py-0.5 text-xs outline-none"
                          />
                          <button
                            onClick={() => saveRename(session.id)}
                            className="p-1 hover:text-emerald-500 text-gray-400"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:text-red-500 text-gray-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onSelectSession(session.id);
                              onNavigate?.("chat");
                              if (window.innerWidth < 768) onClose();
                            }}
                            className="flex-1 text-left truncate pr-1"
                            title={session.title}
                          >
                            {session.title}
                          </button>

                          {/* Options on hover */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startRename(session);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title="Rename"
                            >
                              <Edit3 size={11} />
                            </button>
                            {globalConfig?.showDeleteChatButton !== false && (
                              <button
                                id={`sidebar-delete-chat-${session.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSessionPendingDelete(session);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                                title="Delete conversation"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Display realistic default items from reference screenshot if sessions are empty */
                DEFAULT_RECENT_TITLES.map((title, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onNewChat();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="flex items-center rounded-full px-3 py-1.5 text-xs font-normal text-[#444746] dark:text-neutral-300 hover:bg-[#E2E7ED] dark:hover:bg-neutral-800/60 transition cursor-pointer truncate"
                    title={title}
                  >
                    <span className="truncate">{title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom User Profile & Settings Row (with Full Popover Menu) */}
        <div className="relative p-2 border-t border-[#E5E7EB] dark:border-neutral-800 bg-[#F0F4F9] dark:bg-[#181a20]" ref={settingsMenuRef}>
          {/* User Row in Bottom Bar */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-full hover:bg-[#E2E7ED] dark:hover:bg-neutral-800 transition">
            {/* User Profile Avatar & Name */}
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-[#1F1F1F] dark:text-neutral-200 truncate">
                {displayName}
              </span>
            </div>

            {/* Settings Gear Button */}
            <button
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition cursor-pointer"
              title="Settings & More"
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
          </div>

          {/* Floating Settings Popover Menu - Exact Layout from image.png */}
          {settingsMenuOpen && (
            <div
              className="absolute bottom-14 left-2 w-[270px] bg-white dark:bg-[#1e1f20] rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 py-1.5 z-50 text-xs text-[#1F1F1F] dark:text-neutral-200 animate-in fade-in zoom-in-95"
            >
              <div className="max-h-[70vh] overflow-y-auto">
                {/* 1. Activity */}
                <button
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    onNavigate?.("activity");
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                >
                  <Clock size={16} className="text-gray-500" />
                  <span>Activity</span>
                </button>

                {/* 2. Personal Intelligence */}
                {globalConfig?.showMemoryButton !== false && (
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onNavigate?.("personal-intelligence");
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-gray-500" />
                      <span>Personal Intelligence</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#1A73E8]" />
                  </button>
                )}

                {/* 3. Import memory to Soul Lost */}
                {globalConfig?.showMemoryButton !== false && (
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onOpenImportMemory?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <Download size={16} className="text-gray-500" />
                    <span>Import memory to Soul Lost</span>
                  </button>
                )}

                {/* 4. Export memory to Soul Lost */}
                {globalConfig?.showMemoryButton !== false && (
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onOpenExportMemory?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <Upload size={16} className="text-gray-500" />
                    <span>Export memory to Soul Lost</span>
                  </button>
                )}

                {/* 6. Theme (with flying Submenu) */}
                <div className="relative">
                  <button
                    onClick={() => setThemeSubmenuOpen(!themeSubmenuOpen)}
                    onMouseEnter={() => setThemeSubmenuOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon size={16} className="text-gray-500" />
                      ) : (
                        <Sun size={16} className="text-gray-500" />
                      )}
                      <span>Theme</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </button>

                  {/* Theme Flyout Submenu */}
                  {themeSubmenuOpen && (
                    <div
                      className="absolute left-[98%] top-0 ml-1 w-36 bg-white dark:bg-[#1e1f20] rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-700 py-1.5 z-50 animate-in fade-in"
                      onMouseLeave={() => setThemeSubmenuOpen(false)}
                    >
                      <button
                        onClick={() => {
                          const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                          onSetTheme?.(isDark ? "dark" : "light");
                          setThemeSubmenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer text-xs text-gray-700 dark:text-neutral-300"
                      >
                        <span>System Auto</span>
                      </button>
                      <button
                        onClick={() => {
                          onSetTheme?.("light");
                          setThemeSubmenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer text-xs text-gray-700 dark:text-neutral-300"
                      >
                        <span>Light Mode</span>
                        {theme === "light" && <Check size={14} className="text-[#A4C639]" />}
                      </button>
                      <button
                        onClick={() => {
                          onSetTheme?.("dark");
                          setThemeSubmenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer text-xs text-gray-700 dark:text-neutral-300"
                      >
                        <span>Dark Mode</span>
                        {theme === "dark" && <Check size={14} className="text-[#A4C639]" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* 7. View subscriptions */}
                {globalConfig?.showUpgradeButton !== false && (
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onOpenUpgrade?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <CreditCard size={16} className="text-gray-500" />
                    <span>View subscriptions</span>
                  </button>
                )}

                {/* 8. Soul Lost Notebook */}
                {globalConfig?.showNotebookButton !== false && (
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onNavigate?.("notebook");
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <BookOpen size={16} className="text-gray-500" />
                    <span>Soul Lost Notebook</span>
                  </button>
                )}

                {/* 9. Send feedback */}
                <button
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    onOpenFeedback?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                >
                  <MessageSquare size={16} className="text-gray-500" />
                  <span>Send feedback</span>
                </button>

                {/* 10. Help */}
                <button
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    onNavigate?.("help");
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-gray-500" />
                    <span>Help</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400" />
                </button>

                {/* Clear all chats */}
                {globalConfig?.showClearAllButton !== false && (
                  <button
                    id="sidebar-clear-all-btn"
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      setShowClearAllConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-left transition cursor-pointer text-red-600 dark:text-red-400"
                  >
                    <Trash2 size={16} />
                    <span>Clear all chats</span>
                  </button>
                )}

                {/* Admin Access (if Super Admin or Admin) */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[#5f7d0e] dark:text-[#A4C639] hover:bg-[#A4C639]/10 text-left font-semibold transition cursor-pointer border-t border-gray-100 dark:border-neutral-800"
                  >
                    <Shield size={16} />
                    <span>Admin Command Center</span>
                  </button>
                )}

                {/* Divider Line */}
                <div className="my-1 border-t border-gray-200 dark:border-neutral-800" />

                {/* Location Footer section */}
                <div className="px-4 py-2 text-[11px] text-gray-500 dark:text-neutral-400 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-medium text-[#1F1F1F] dark:text-neutral-200">
                    <span className="w-2 h-2 rounded-full bg-[#1A73E8]" />
                    <span>{userLocation}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-neutral-500">
                    Based on your places (Home)
                  </div>
                  <button
                    onClick={() => {
                      setSettingsMenuOpen(false);
                      onOpenLocationModal?.();
                    }}
                    className="text-[11px] text-[#1A73E8] hover:underline block pt-0.5 cursor-pointer"
                  >
                    Update location
                  </button>
                </div>

                {/* User Auth Sign out / Sign in */}
                {currentUser ? (
                  <div className="px-4 pt-1.5 pb-1 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        setSettingsMenuOpen(false);
                        onSignOut();
                      }}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-2 py-1 cursor-pointer font-medium"
                    >
                      <LogOut size={13} />
                      <span>Sign out</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 pt-1.5 pb-1 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        setSettingsMenuOpen(false);
                        onOpenAuth("login");
                      }}
                      className="text-xs text-[#1A73E8] hover:underline flex items-center gap-2 py-1 cursor-pointer font-medium"
                    >
                      <LogIn size={13} />
                      <span>Sign in to save chats</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Confirmation Modal for deleting a chat */}
      <ConfirmDeleteModal
        isOpen={!!sessionPendingDelete}
        title="Delete conversation?"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        itemName={sessionPendingDelete?.title}
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => {
          if (sessionPendingDelete) {
            onDeleteSession(sessionPendingDelete.id);
            setSessionPendingDelete(null);
          }
        }}
        onClose={() => setSessionPendingDelete(null)}
      />

      {/* Confirmation Modal for Clear All chats */}
      <ConfirmDeleteModal
        isOpen={showClearAllConfirm}
        title="Clear all chats?"
        message="Are you sure you want to clear all conversations? All your chat histories will be removed."
        confirmText="Yes, Clear All"
        cancelText="No, Keep Chats"
        onConfirm={() => {
          onClearAll();
          setShowClearAllConfirm(false);
        }}
        onClose={() => setShowClearAllConfirm(false)}
      />
    </>
  );
};
