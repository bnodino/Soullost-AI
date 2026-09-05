import React, { useState, useEffect, useCallback } from "react";
import {
  Key,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  Power,
  RotateCcw,
  Zap,
  Activity,
  ShieldCheck,
  Search,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { ApiKeyItem, ApiKeySummary, ApiKeyTestResult } from "../../types";

export const AdminApiKeysTab: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [summary, setSummary] = useState<ApiKeySummary>({
    total: 0,
    active: 0,
    quotaExhausted: 0,
    invalid: 0,
    disabled: 0,
    totalRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // New Key Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isTestingNewKey, setIsTestingNewKey] = useState(false);
  const [newKeyTestResult, setNewKeyTestResult] = useState<ApiKeyTestResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Per-key action states
  const [recheckingKeyId, setRecheckingKeyId] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    // Live polling every 10 seconds to show real-time live statuses
    const interval = setInterval(fetchKeys, 10000);
    return () => clearInterval(interval);
  }, [fetchKeys]);

  // Test a key before adding
  const handleTestKeyBeforeAdd = async () => {
    if (!newKeyValue.trim()) {
      setFormError("অনুগ্রহ করে একটি API Key লিখুন (Please enter an API Key to test)");
      return;
    }
    setFormError(null);
    setIsTestingNewKey(true);
    setNewKeyTestResult(null);

    try {
      const res = await fetch("/api/admin/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKeyValue.trim() }),
      });
      const result: ApiKeyTestResult = await res.json();
      setNewKeyTestResult(result);
    } catch (err: any) {
      setNewKeyTestResult({
        valid: false,
        status: "error",
        message: err?.message || "Failed to reach backend test service.",
        latencyMs: 0,
      });
    } finally {
      setIsTestingNewKey(false);
    }
  };

  // Submit and save new key
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) {
      setFormError("API Key cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim() || `API Key #${keys.length + 1}`,
          key: newKeyValue.trim(),
          validateFirst: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add API key.");
      }

      setBannerMessage({
        type: "success",
        text: `নতুন API Key সফলভাবে যুক্ত করা হয়েছে! ${data.message || ""}`,
      });
      setShowAddModal(false);
      setNewKeyName("");
      setNewKeyValue("");
      setNewKeyTestResult(null);
      fetchKeys();
    } catch (err: any) {
      setFormError(err?.message || "API key save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test an existing key in the pool
  const handleRecheckKey = async (keyId: string) => {
    setRecheckingKeyId(keyId);
    try {
      const res = await fetch(`/api/admin/keys/${keyId}/test`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setBannerMessage({
          type: data.result?.valid ? "success" : "error",
          text: `Key "${data.key?.name}": ${data.result?.message || "Check complete."}`,
        });
        fetchKeys();
      } else {
        setBannerMessage({
          type: "error",
          text: data.error || "Failed to recheck key.",
        });
      }
    } catch (err: any) {
      setBannerMessage({
        type: "error",
        text: err?.message || "Network error during check.",
      });
    } finally {
      setRecheckingKeyId(null);
    }
  };

  // Toggle enable / disable
  const handleToggleKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/admin/keys/${keyId}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to toggle key:", err);
    }
  };

  // Reset status to active (for quota exhausted key)
  const handleResetKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/admin/keys/${keyId}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: "API Key status reset to ACTIVE. Rotation engine will now use this key.",
        });
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to reset key status:", err);
    }
  };

  // Reset all exhausted keys
  const handleResetAllExhausted = async () => {
    try {
      const res = await fetch("/api/admin/keys/reset-all", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setBannerMessage({
          type: "success",
          text: data.message || "All quota-exhausted keys reset to Active!",
        });
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to reset all:", err);
    }
  };

  // Delete key
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to remove this API key from the failover pool?")) {
      return;
    }
    setDeletingKeyId(keyId);
    try {
      const res = await fetch(`/api/admin/keys/${keyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBannerMessage({
          type: "info",
          text: "API Key removed from failover pool.",
        });
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to delete key:", err);
    } finally {
      setDeletingKeyId(null);
    }
  };

  // Filter keys
  const filteredKeys = keys.filter((k) => {
    const matchQuery =
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.maskedKey.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || k.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Banner message */}
      {bannerMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold animate-in fade-in duration-200 ${
            bannerMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : bannerMessage.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === "success" && <CheckCircle2 size={16} />}
            {bannerMessage.type === "error" && <AlertTriangle size={16} />}
            {bannerMessage.type === "info" && <ShieldCheck size={16} />}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Overview & Auto-Failover Concept */}
      <div className="bg-gradient-to-br from-[#1C1F26] via-[#16181F] to-[#0F1015] rounded-3xl p-6 border border-neutral-800 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#A4C639]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-[#A4C639]/20 text-[#A4C639]">
                <Zap size={18} />
              </span>
              <h2 className="text-lg font-bold">API Key Auto-Failover & Multi-Key Pool</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Engine
              </span>
            </div>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              এখানে একাধিক Gemini API Key যোগ করুন। ব্যবহারকারীর চ্যাট বা কোশ্চেন চলাকালীন একটি API Key-এর Limit (Quota 429) শেষ হয়ে গেলে সিস্টেম <strong>স্বয়ংক্রিয়ভাবে পরবর্তী সচল API Key-তে Switch করবে</strong>। কোনো ইন্টারাপশন ছাড়াই অ্যাপ ২৪/৭ নিরবচ্ছিন্ন চলবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchKeys}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Refresh live status"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh Status</span>
            </button>

            {summary.quotaExhausted > 0 && (
              <button
                onClick={handleResetAllExhausted}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset All Quota Exhausted ({summary.quotaExhausted})</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError(null);
                setNewKeyTestResult(null);
              }}
              className="px-4 py-2 rounded-xl bg-[#A4C639] hover:bg-[#81A618] text-neutral-900 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#A4C639]/20 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>নতুন API Key যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Live Pool Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-5 border-t border-neutral-800/80">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[11px] text-neutral-400 font-medium">Total Keys</div>
            <div className="text-xl font-bold text-white mt-1">{summary.total}</div>
          </div>

          <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20">
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Active & Live</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{summary.active}</div>
          </div>

          <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>Quota Exhausted</span>
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{summary.quotaExhausted}</div>
          </div>

          <div className="bg-red-500/10 rounded-2xl p-3 border border-red-500/20">
            <div className="text-[11px] text-red-400 font-medium flex items-center gap-1">
              <XCircle size={12} />
              <span>Invalid</span>
            </div>
            <div className="text-xl font-bold text-red-400 mt-1">{summary.invalid}</div>
          </div>

          <div className="bg-neutral-500/10 rounded-2xl p-3 border border-neutral-500/20">
            <div className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
              <Power size={12} />
              <span>Disabled</span>
            </div>
            <div className="text-xl font-bold text-neutral-300 mt-1">{summary.disabled}</div>
          </div>

          <div className="bg-[#A4C639]/10 rounded-2xl p-3 border border-[#A4C639]/20">
            <div className="text-[11px] text-[#A4C639] font-medium flex items-center gap-1">
              <Activity size={12} />
              <span>Requests Served</span>
            </div>
            <div className="text-xl font-bold text-[#A4C639] mt-1">{summary.totalRequests}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keys by label or prefix..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#181a20] border border-[#E0E0E0] dark:border-neutral-800 text-xs text-gray-800 dark:text-neutral-200 placeholder-gray-400 focus:outline-hidden focus:border-[#A4C639]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: `All (${keys.length})` },
            { id: "active", label: `Active (${summary.active})` },
            { id: "quota_exhausted", label: `Quota Exhausted (${summary.quotaExhausted})` },
            { id: "invalid", label: `Invalid (${summary.invalid})` },
            { id: "disabled", label: `Disabled (${summary.disabled})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#283549] dark:text-[#D3E3FD]"
                  : "bg-white dark:bg-[#181a20] text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-[#E0E0E0] dark:border-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Keys Table / Card Grid */}
      {filteredKeys.length === 0 ? (
        <div className="bg-white dark:bg-[#181a20] rounded-3xl p-12 text-center border border-[#E0E0E0] dark:border-neutral-800">
          <Key size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-neutral-200">
            {searchQuery || statusFilter !== "all"
              ? "কোনো API Key পাওয়া যায়নি"
              : "এখনো কোনো অতিরিক্ত API Key যোগ করা হয়নি"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
            {searchQuery || statusFilter !== "all"
              ? "অনুগ্রহ করে আপনার সার্চ ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।"
              : "আপনি চাইলে একাধিক Google AI Studio API Key যুক্ত করে রাখতে পারেন, যাতে একটির লিমিট শেষ হলে স্বয়ংক্রিয়ভাবে ব্যাকআপ কি কাজ শুরু করে।"}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#A4C639] hover:bg-[#81A618] text-neutral-900 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>নতুন API Key যুক্ত করুন</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKeys.map((item, idx) => {
            const isRechecking = recheckingKeyId === item.id;
            const isDeleting = deletingKeyId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                  item.status === "active"
                    ? "bg-white dark:bg-[#181a20] border-[#E0E0E0] dark:border-neutral-800 hover:border-emerald-500/40"
                    : item.status === "quota_exhausted"
                    ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-300 dark:border-amber-900/40"
                    : item.status === "invalid"
                    ? "bg-red-50/40 dark:bg-red-950/10 border-red-300 dark:border-red-900/40"
                    : "bg-gray-50 dark:bg-neutral-900/40 border-gray-200 dark:border-neutral-800 opacity-70"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Key Name, Mask, and Badges */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                        item.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : item.status === "quota_exhausted"
                          ? "bg-amber-500/10 text-amber-500"
                          : item.status === "invalid"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-neutral-500/10 text-neutral-400"
                      }`}
                    >
                      <Key size={18} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {item.name}
                        </span>

                        {item.isEnvDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            Primary Server Key
                          </span>
                        )}

                        {/* Live Status Badge */}
                        {item.status === "active" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live & Ready
                          </span>
                        )}

                        {item.status === "quota_exhausted" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <AlertTriangle size={12} />
                            Limit Exhausted (429)
                          </span>
                        )}

                        {item.status === "invalid" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                            <XCircle size={12} />
                            Invalid Key
                          </span>
                        )}

                        {item.status === "disabled" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
                            <Power size={11} />
                            Disabled
                          </span>
                        )}
                      </div>

                      {/* Masked Key & Metadata */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5 font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md">
                          <span>{item.maskedKey}</span>
                        </div>

                        {item.latencyMs !== undefined && item.latencyMs > 0 && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Activity size={12} className="text-emerald-500" />
                            <span>{item.latencyMs}ms response</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px]">
                          <Zap size={12} className="text-[#A4C639]" />
                          <span>{item.requestsHandled || 0} requests served</span>
                        </div>

                        {item.lastUsedAt && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock size={12} />
                            <span>Last used: {new Date(item.lastUsedAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Error Banner if any */}
                      {item.lastError && (
                        <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          <strong>Live Diagnostics:</strong> {item.lastError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 md:self-center">
                    {/* Live Test / Recheck */}
                    <button
                      onClick={() => handleRecheckKey(item.id)}
                      disabled={isRechecking}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Test this key's live status immediately"
                    >
                      <RefreshCw size={13} className={isRechecking ? "animate-spin" : ""} />
                      <span>{isRechecking ? "Testing..." : "Live Test"}</span>
                    </button>

                    {/* Reset Quota Button */}
                    {item.status === "quota_exhausted" && (
                      <button
                        onClick={() => handleResetKey(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Mark quota replenished and activate"
                      >
                        <RotateCcw size={13} />
                        <span>Reset Quota</span>
                      </button>
                    )}

                    {/* Enable / Disable toggle */}
                    <button
                      onClick={() => handleToggleKey(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        item.status === "disabled"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                          : "bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400"
                      }`}
                      title={item.status === "disabled" ? "Enable key" : "Disable key"}
                    >
                      <Power size={13} />
                      <span>{item.status === "disabled" ? "Enable" : "Disable"}</span>
                    </button>

                    {/* Delete key */}
                    {!item.isEnvDefault && (
                      <button
                        onClick={() => handleDeleteKey(item.id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                        title="Remove key from pool"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guide Note Box */}
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 text-xs text-blue-800 dark:text-blue-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <HelpCircle size={16} className="text-blue-500" />
          <span>কীভাবে এই সিস্টেম কাজ করে? (How Multi-Key Failover Operates)</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[12px] leading-relaxed opacity-90">
          <li>
            <strong>স্বয়ংক্রিয় রোটেট (Auto-Rotation):</strong> ব্যবহারকারী যখনই চ্যাটে কোনো প্রশ্ন করেন, সার্ভার পুলে থাকা প্রথম সক্রিয় API Key ব্যবহার করে।
          </li>
          <li>
            <strong>সীমাবদ্ধতা সনাক্তকরণ (Quota Detection):</strong> কোনো Key যদি Google-এর <code>ResourceExhausted / HTTP 429</code> সীমা অতিক্রম করে, সিস্টেম চ্যাট বাতিল না করে <strong>তাত্ক্ষণিকভাবে পরবর্তী সক্রিয় Key-তে সুইচ করবে</strong> এবং রিকোয়েস্ট সফলভাবে শেষ করবে।
          </li>
          <li>
            <strong>লাইভ টেস্টিং (Pre-Add Validation):</strong> নতুন API Key যুক্ত করার সময় আপনি “Test Key First” বাটনে ক্লিক করে সাথে সাথে চেক করে নিতে পারবেন কিটি সক্রিয় আছে নাকি ইনভ্যালিড।
          </li>
        </ul>
      </div>

      {/* Add New API Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#181a20] rounded-3xl border border-[#E0E0E0] dark:border-neutral-800 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E0E0] dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#A4C639]/20 text-[#A4C639] flex items-center justify-center font-bold">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    নতুন Gemini API Key যুক্ত করুন
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                    Add new API Key with real-time pre-validation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                  Key Label / নাম (Optional)
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Backup Key #2 (Work Account)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-[#E0E0E0] dark:border-neutral-800 text-xs text-gray-800 dark:text-neutral-200 focus:outline-hidden focus:border-[#A4C639]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                    Gemini API Key (AI Studio Secret) *
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#A4C639] hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={newKeyValue}
                    onChange={(e) => {
                      setNewKeyValue(e.target.value);
                      setNewKeyTestResult(null);
                      setFormError(null);
                    }}
                    placeholder="AIzaSy..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-[#E0E0E0] dark:border-neutral-800 font-mono text-xs text-gray-800 dark:text-neutral-200 focus:outline-hidden focus:border-[#A4C639]"
                  />
                </div>
              </div>

              {/* Live Test Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestKeyBeforeAdd}
                  disabled={isTestingNewKey || !newKeyValue.trim()}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold text-gray-700 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isTestingNewKey ? "animate-spin" : ""} />
                  <span>{isTestingNewKey ? "লাইভ চেক করা হচ্ছে..." : "কিটি ঠিক আছে কি না টেস্ট করুন"}</span>
                </button>

                <span className="text-[11px] text-gray-400">Realtime Google GenAI Check</span>
              </div>

              {/* Test Result Display */}
              {newKeyTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs animate-in fade-in duration-200 ${
                    newKeyTestResult.valid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      : newKeyTestResult.status === "quota_exhausted"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                      : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {newKeyTestResult.valid ? (
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        {newKeyTestResult.valid
                          ? "API Key সচল এবং সক্রিয়! (Active & Working)"
                          : newKeyTestResult.status === "quota_exhausted"
                          ? "কোটা শেষ হয়ে গেছে (Quota Limit Exhausted - 429)"
                          : "ভুল বা অকার্যকর API Key (Invalid Key)"}
                      </div>
                      <p className="text-[11px] mt-0.5 opacity-90">{newKeyTestResult.message}</p>
                      {newKeyTestResult.latencyMs > 0 && (
                        <p className="text-[10px] mt-1 opacity-75 font-mono">
                          Latency: {newKeyTestResult.latencyMs}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Error */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E0E0E0] dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isTestingNewKey}
                  className="px-5 py-2 rounded-xl bg-[#A4C639] hover:bg-[#81A618] text-neutral-900 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#A4C639]/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={14} />}
                  <span>{isSubmitting ? "যুক্ত হচ্ছে..." : "পুলে যুক্ত করুন (Add to Pool)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
