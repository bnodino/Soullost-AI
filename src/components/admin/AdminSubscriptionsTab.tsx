import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  Layers,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { SubscriptionPlan } from "../../types";
import { saveSubscriptionPlan, deleteSubscriptionPlan } from "../../lib/firebase";

interface AdminSubscriptionsTabProps {
  plans: SubscriptionPlan[];
  adminEmail: string;
}

export const AdminSubscriptionsTab: React.FC<AdminSubscriptionsTabProps> = ({
  plans,
  adminEmail,
}) => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isNewPlan, setIsNewPlan] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenNew = () => {
    setIsNewPlan(true);
    setEditingPlan({
      id: "plan-" + Date.now().toString().slice(-4),
      name: "New Tier",
      priceMonthly: 12.99,
      priceYearly: 120.0,
      currency: "USD",
      badge: "New",
      description: "Custom intelligence and high capacity access.",
      features: [
        "Full 25,000,000 letters per question support",
        "Priority model access",
        "Personal intelligence memory storage",
      ],
      modelAccess: ["fruitfly-plus", "fruitfly-pro"],
      maxLettersPerQuestion: 25000000,
      isActive: true,
      color: "#1A73E8",
      createdAt: new Date().toISOString(),
    });
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setIsNewPlan(false);
    setEditingPlan({ ...plan, features: [...plan.features] });
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${planName}" subscription tier?`)) {
      return;
    }
    try {
      await deleteSubscriptionPlan(planId, adminEmail);
      setSuccessMsg(`Subscription plan "${planName}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Error deleting plan:", err);
      setError(err?.message || "Failed to delete subscription plan.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    if (!editingPlan.id.trim() || !editingPlan.name.trim()) {
      setError("Please provide a valid plan ID and name.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveSubscriptionPlan(editingPlan, adminEmail);
      setSuccessMsg(`Subscription plan "${editingPlan.name}" saved successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingPlan(null);
    } catch (err: any) {
      console.error("Error saving plan:", err);
      setError(err?.message || "Failed to save subscription plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFeature = () => {
    if (!featureInput.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, featureInput.trim()],
    });
    setFeatureInput("");
  };

  const handleRemoveFeature = (idx: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#181a20] p-5 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white flex items-center gap-2">
            <CreditCard className="text-[#1A73E8]" size={18} />
            Subscription Plans & Pricing Engine
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Configure pricing tiers, letter ingestion capacities, model allowances, and public perks
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>Add New Subscription</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col justify-between bg-white dark:bg-[#181a20] rounded-3xl border ${
              plan.isPopular
                ? "border-[#1A73E8] shadow-md ring-1 ring-[#1A73E8]/30"
                : "border-[#E0E0E0] dark:border-neutral-800 shadow-xs"
            } p-5 text-xs transition`}
          >
            <div>
              {/* Badge & Active State */}
              <div className="flex items-center justify-between gap-2 mb-3">
                {plan.badge ? (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: plan.color || "#1A73E8" }}
                  >
                    {plan.badge}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Tier</span>
                )}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    plan.isActive
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-neutral-800 text-gray-400"
                  }`}
                >
                  {plan.isActive ? "Live" : "Draft"}
                </span>
              </div>

              {/* Title & Price */}
              <h3 className="font-bold text-base text-[#1F1F1F] dark:text-white mb-1">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-black text-[#1F1F1F] dark:text-white">
                  ${plan.priceMonthly}
                </span>
                <span className="text-gray-500 dark:text-neutral-400 text-xs">/month</span>
              </div>
              <p className="text-gray-500 dark:text-neutral-400 text-[11px] leading-relaxed mb-4 line-clamp-2">
                {plan.description}
              </p>

              {/* Ingestion Limit */}
              <div className="p-2.5 rounded-xl bg-[#F0F4F9] dark:bg-[#14151a] mb-3 text-[11px]">
                <span className="text-gray-400 block text-[10px]">Text Processing Limit:</span>
                <span className="font-bold text-[#1A73E8]">
                  {plan.maxLettersPerQuestion.toLocaleString()} letters / prompt
                </span>
              </div>

              {/* Feature bullets */}
              <div className="space-y-1.5 mb-5">
                {plan.features.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-[#444746] dark:text-neutral-300">
                    <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{f}</span>
                  </div>
                ))}
                {plan.features.length > 5 && (
                  <div className="text-[10px] text-gray-400 pl-5">
                    +{plan.features.length - 5} more features
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => handleOpenEdit(plan)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(plan.id, plan.name)}
                title="Delete Tier"
                className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#181a20] rounded-3xl border border-[#E0E0E0] dark:border-neutral-800 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-xs text-[#1F1F1F] dark:text-neutral-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-[#1F1F1F] dark:text-white flex items-center gap-2">
                <CreditCard size={16} className="text-[#1A73E8]" />
                {isNewPlan ? "Create Subscription Plan" : `Edit Plan: ${editingPlan.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Plan ID & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Plan Slug / ID
                  </label>
                  <input
                    type="text"
                    value={editingPlan.id}
                    disabled={!isNewPlan}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-mono outline-none disabled:opacity-60"
                    placeholder="e.g. pro-tier"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Plan Display Name
                  </label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-medium outline-none"
                    placeholder="e.g. Soul Lost Pro Plus"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.priceMonthly}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, priceMonthly: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Yearly Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.priceYearly || 0}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, priceYearly: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={editingPlan.badge || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                    placeholder="e.g. Popular"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                  Plan Description
                </label>
                <textarea
                  rows={2}
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                  placeholder="Summary of this tier's target audience and key advantages"
                />
              </div>

              {/* Max letters & Accent color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Max Text Capacity (Letters/Question)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.maxLettersPerQuestion}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxLettersPerQuestion: parseInt(e.target.value) || 25000000,
                      })
                    }
                    min={1000}
                    max={25000000}
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-bold outline-none"
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Default Soul Lost standard is 25,000,000 letters
                  </span>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingPlan.color || "#1A73E8"}
                      onChange={(e) => setEditingPlan({ ...editingPlan, color: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 p-0.5 cursor-pointer"
                    />
                    <span className="font-mono text-xs">{editingPlan.color || "#1A73E8"}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Feature Checklist */}
              <div>
                <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                  Features & Perks ({editingPlan.features.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Add a new feature bullet point..."
                    className="flex-1 p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-neutral-50 dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800">
                  {editingPlan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-[#1e2029] border border-gray-100 dark:border-neutral-700 text-[11px]"
                    >
                      <span className="truncate">{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                    className="accent-[#1A73E8] cursor-pointer"
                  />
                  <span className="font-semibold">Plan is Active & Visible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isPopular || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                    className="accent-[#1A73E8] cursor-pointer"
                  />
                  <span className="font-semibold">Highlight as Most Popular</span>
                </label>
              </div>

              {/* Submit / Cancel */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSaving ? <span>Saving...</span> : <><Check size={14} /><span>Save Subscription Plan</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
