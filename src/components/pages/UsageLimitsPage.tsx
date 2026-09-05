import React from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Crown,
  HelpCircle,
  PieChart,
  Sparkles,
  Zap,
} from "lucide-react";

interface UsageLimitsPageProps {
  onBackToChat: () => void;
  onOpenUpgrade: () => void;
}

export const UsageLimitsPage: React.FC<UsageLimitsPageProps> = ({
  onBackToChat,
  onOpenUpgrade,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F9FA] dark:bg-[#131418] text-[#1F1F1F] dark:text-[#E3E3E3]">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-neutral-800 bg-white/80 dark:bg-[#1e1f20]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            title="Back to Chat"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <PieChart className="text-[#1A73E8]" size={22} />
              Usage Limits & Quotas
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Transparent tracking of your model rate limits, daily quotas, and image credits
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpgrade}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full hover:opacity-95 transition cursor-pointer shadow-2xs"
        >
          <Crown size={14} />
          <span>Upgrade Tier</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Tier Status Banner */}
        <div className="bg-gradient-to-br from-[#E8F0FE] to-[#D3E3FD]/60 dark:from-blue-950/60 dark:to-neutral-900 rounded-3xl p-6 border border-[#1A73E8]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#1A73E8] dark:text-[#8AB4F8] bg-white/60 dark:bg-black/40 px-3 py-1 rounded-full">
              Current Plan
            </span>
            <h2 className="text-2xl font-bold text-[#1F1F1F] dark:text-white mt-2">
              Soul Lost Free Tier
            </h2>
            <p className="text-xs text-gray-600 dark:text-neutral-300 mt-1">
              Active plan with high-speed access to Soul Lost Flash-Lite and essential studio tools.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/80 dark:bg-neutral-800/80 px-4 py-2.5 rounded-2xl border border-white/60 dark:border-neutral-700 shadow-2xs text-xs">
            <Clock size={16} className="text-[#1A73E8]" />
            <div>
              <div className="text-[10px] text-gray-400">Quota Resets In</div>
              <div className="font-semibold text-gray-700 dark:text-neutral-200">
                8 hours 42 mins
              </div>
            </div>
          </div>
        </div>

        {/* Quota Progress Meters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Soul Lost 3.1 Flash-Lite */}
          <div className="bg-white dark:bg-[#1e1f20] p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="text-emerald-500" size={18} />
                <span className="text-sm font-semibold">Soul Lost 3.1 Flash-Lite</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                Unlimited
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[25%]" />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Fastest everyday chats</span>
              <span>No daily cap</span>
            </div>
          </div>

          {/* Soul Lost 3.8 Flash Reasoning */}
          <div className="bg-white dark:bg-[#1e1f20] p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#1A73E8]" size={18} />
                <span className="text-sm font-semibold">Soul Lost 3.8 Flash & Thinking</span>
              </div>
              <span className="text-xs font-semibold text-[#1A73E8] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                18 / 50 Used
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-[#1A73E8] h-full w-[36%]" />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Multimodal reasoning</span>
              <span>32 prompts remaining</span>
            </div>
          </div>

          {/* Soul Lost Image Studio */}
          <div className="bg-white dark:bg-[#1e1f20] p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-bold">✦</span>
                <span className="text-sm font-semibold">Soul Lost Image Studio</span>
              </div>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-full">
                6 / 20 Used
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-[30%]" />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>High resolution image creation</span>
              <span>14 generations left</span>
            </div>
          </div>

          {/* Web Search Grounding */}
          <div className="bg-white dark:bg-[#1e1f20] p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">🌐</span>
                <span className="text-sm font-semibold">Real-Time Web Search</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                12 / 100 Used
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[12%]" />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Up-to-date live search retrieval</span>
              <span>88 queries left</span>
            </div>
          </div>
        </div>

        {/* Upgrade Plan Comparison */}
        <div className="bg-white dark:bg-[#1e1f20] p-6 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-4">
          <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-white">
            Need Higher Limits? Compare Plans
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60 space-y-3">
              <div className="font-bold text-sm">Free Tier</div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                $0 <span className="text-xs font-normal text-gray-500">/ forever</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  Unlimited Soul Lost 3.1 Flash-Lite
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  50 Reasoning queries per day
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  20 Image generations per day
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border-2 border-[#1A73E8] bg-blue-50/40 dark:bg-blue-950/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-[#1A73E8]">Soul Lost Advanced</div>
                <span className="text-[10px] font-bold bg-[#1A73E8] text-white px-2.5 py-0.5 rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#1A73E8]">
                $19.99 <span className="text-xs font-normal text-gray-500">/ month (1 Mo Free Trial)</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-700 dark:text-neutral-200">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1A73E8]" />
                  Priority 2M token context window
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1A73E8]" />
                  Unlimited Deep Thinking and Pro models
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#1A73E8]" />
                  Unlimited Ultra HD Image Studio generations
                </li>
              </ul>

              <button
                onClick={onOpenUpgrade}
                className="w-full py-2 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer mt-2"
              >
                Start 1-Month Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
