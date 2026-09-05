import React, { useState, useEffect } from "react";
import { X, CreditCard, Check, Calendar, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { UserProfile, SubscriptionPlan } from "../../types";
import { setUserSubscriptionByAdmin } from "../../lib/firebase";

interface AdminUserSubscriptionModalProps {
  user: UserProfile | null;
  plans: SubscriptionPlan[];
  adminEmail: string;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

export const AdminUserSubscriptionModal: React.FC<AdminUserSubscriptionModalProps> = ({
  user,
  plans,
  adminEmail,
  onClose,
  onSuccess,
}) => {
  if (!user) return null;

  const [tier, setTier] = useState<string>(user.subscriptionTier || "free");
  const [status, setStatus] = useState<"active" | "trial" | "expired" | "cancelled" | "lifetime">(
    user.subscriptionStatus || "active"
  );
  const [isLifetime, setIsLifetime] = useState<boolean>(
    user.subscriptionStatus === "lifetime" || !user.subscriptionExpiresAt
  );
  const [expiresAt, setExpiresAt] = useState<string>(() => {
    if (user.subscriptionExpiresAt) {
      return user.subscriptionExpiresAt.split("T")[0];
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [customQuota, setCustomQuota] = useState<number>(
    user.customQuotaLetters || 25000000
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const finalStatus = isLifetime ? "lifetime" : status;
      const finalExpires = isLifetime ? undefined : new Date(expiresAt).toISOString();

      await setUserSubscriptionByAdmin(
        user.uid,
        {
          subscriptionTier: tier,
          subscriptionStatus: finalStatus,
          subscriptionExpiresAt: finalExpires,
          customQuotaLetters: Number(customQuota) || 25000000,
        },
        adminEmail
      );

      onSuccess({
        ...user,
        subscriptionTier: tier,
        subscriptionStatus: finalStatus,
        subscriptionExpiresAt: finalExpires,
        customQuotaLetters: Number(customQuota) || 25000000,
      });
      onClose();
    } catch (err: any) {
      console.error("Error setting user subscription:", err);
      setError(err?.message || "Failed to update subscription. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPlanObj = plans.find((p) => p.id === tier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#181a20] rounded-3xl border border-[#E0E0E0] dark:border-neutral-800 p-6 shadow-2xl space-y-5 text-[#1F1F1F] dark:text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0] dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D3E3FD] dark:bg-blue-950/60 text-[#041E49] dark:text-[#8AB4F8] flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1F1F1F] dark:text-white">
                Manage User Subscription
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                Assign membership tier, trial, or status for this account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-[#F0F4F9] dark:bg-[#14151a] border border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-[#1F1F1F] dark:text-white">
              {user.displayName || "Anonymous User"}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
              {user.email}
            </div>
          </div>
          <div className="text-right text-[11px]">
            <span className="text-gray-400">Role: </span>
            <span className="font-bold uppercase text-[#1A73E8]">{user.role}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Tier Selection */}
          <div>
            <label className="font-semibold block mb-1 text-[#444746] dark:text-neutral-300">
              Subscription Plan / Tier
            </label>
            <select
              value={tier}
              onChange={(e) => {
                const nextTier = e.target.value;
                setTier(nextTier);
                const plan = plans.find((p) => p.id === nextTier);
                if (plan?.maxLettersPerQuestion) {
                  setCustomQuota(plan.maxLettersPerQuestion);
                }
              }}
              className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-medium outline-none cursor-pointer"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.priceMonthly}/month ({p.isActive ? "Active" : "Disabled"})
                </option>
              ))}
            </select>
            {selectedPlanObj && (
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                {selectedPlanObj.description}
              </p>
            )}
          </div>

          {/* Status Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-[#444746] dark:text-neutral-300">
                Subscription Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={isLifetime}
                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-medium outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="active">Active (Paid)</option>
                <option value="trial">Free Trial</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#444746] dark:text-neutral-300">
                Max Capacity (Letters)
              </label>
              <input
                type="number"
                value={customQuota}
                onChange={(e) => setCustomQuota(Number(e.target.value))}
                min={1000}
                max={25000000}
                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-medium outline-none"
              />
            </div>
          </div>

          {/* Expiration Settings */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLifetime}
                onChange={(e) => setIsLifetime(e.target.checked)}
                className="rounded accent-[#1A73E8] cursor-pointer"
              />
              <span className="font-semibold text-xs">
                Permanent Lifetime Access (Never Expires)
              </span>
            </label>

            {!isLifetime && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <label className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 block mb-1 flex items-center gap-1.5">
                  <Calendar size={13} />
                  Subscription Expiry Date
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#181a20] text-xs outline-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Update User Subscription</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
