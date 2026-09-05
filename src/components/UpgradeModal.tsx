import React, { useState, useEffect } from "react";
import { Check, Sparkles, X, Zap, Shield, ChevronRight } from "lucide-react";
import { SubscriptionPlan, UserProfile } from "../types";
import { subscribeToSubscriptions, DEFAULT_SUBSCRIPTIONS } from "../lib/firebase";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile?: UserProfile | null;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_SUBSCRIPTIONS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToSubscriptions((loadedPlans) => {
      if (loadedPlans && loadedPlans.length > 0) {
        setPlans(loadedPlans.filter((p) => p.isActive));
      }
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleSimulateUpgrade = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#181a20] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E0E0E0] dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center font-bold">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-sm text-[#1F1F1F] dark:text-white uppercase tracking-wider">
            Soul Lost Intelligence Plans
          </span>
        </div>

        <h3 className="text-2xl font-bold text-[#1F1F1F] dark:text-white mb-2 tracking-tight">
          Supercharge your questions with up to 25,000,000 letters
        </h3>
        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-6 leading-relaxed">
          Unlock unlimited memory, priority speed, and ultra-high capacity text reasoning.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 rounded-full bg-[#F0F4F9] dark:bg-[#14151a] border border-gray-200 dark:border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-[#252836] text-[#1F1F1F] dark:text-white shadow-xs"
                  : "text-gray-500 dark:text-neutral-400"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-[#252836] text-[#1F1F1F] dark:text-white shadow-xs"
                  : "text-gray-500 dark:text-neutral-400"
              }`}
            >
              <span>Yearly Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const price = billingCycle === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12);

            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`relative p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-[#1A73E8] bg-[#1A73E8]/5 dark:bg-[#1A73E8]/10 ring-2 ring-[#1A73E8]"
                    : "border-[#E0E0E0] dark:border-neutral-800 bg-white dark:bg-[#1f2128] hover:border-neutral-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[#1F1F1F] dark:text-white">
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1A73E8] text-white">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-black text-[#1F1F1F] dark:text-white">
                      ${price}
                    </span>
                    <span className="text-[11px] text-gray-500">/mo</span>
                  </div>

                  <div className="text-[10px] font-semibold text-[#1A73E8] mb-3">
                    {plan.maxLettersPerQuestion.toLocaleString()} letters max
                  </div>
                </div>

                <div
                  className={`w-full py-1.5 rounded-xl text-[11px] font-bold text-center transition ${
                    isSelected
                      ? "bg-[#1A73E8] text-white"
                      : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300"
                  }`}
                >
                  {isSelected ? "Selected" : "Select Tier"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Details & Feature Breakdown */}
        {selectedPlan && (
          <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#14151a] border border-[#E0E0E0] dark:border-neutral-800 mb-6 space-y-3">
            <div className="font-bold text-xs text-[#1F1F1F] dark:text-white flex items-center gap-2">
              <Zap size={14} className="text-[#1A73E8]" />
              <span>Included in {selectedPlan.name}:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#444746] dark:text-neutral-300">
              {selectedPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[11px]">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center">
            Subscription request submitted! Your account capacity is now enhanced.
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateUpgrade}
              className="flex-1 py-3 px-4 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white font-bold text-xs transition text-center shadow-xs cursor-pointer"
            >
              Start 1-Month Free Trial on {selectedPlan?.name || "Tier"}
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-full text-xs font-semibold text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
