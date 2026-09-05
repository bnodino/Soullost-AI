import React, { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { ChatSession } from "../../types";

interface ActivityPageProps {
  sessions: ChatSession[];
  onBackToChat: () => void;
  onSelectSession: (id: string) => void;
  onClearActivity: () => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  sessions,
  onBackToChat,
  onSelectSession,
  onClearActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "week">("all");

  // Flatten all user messages to create an activity stream
  const activityItems = sessions.flatMap((session) =>
    session.messages
      .filter((m) => m.role === "user")
      .map((msg) => ({
        id: msg.id,
        sessionId: session.id,
        sessionTitle: session.title,
        text: msg.text,
        timestamp: msg.timestamp,
        modelUsed: msg.modelUsed || "Soul Lost Flash-Lite",
        imagesCount: msg.images?.length || 0,
      }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const filteredItems = activityItems.filter((item) => {
    if (filterPeriod === "today" && item.timestamp < oneDayAgo) return false;
    if (filterPeriod === "week" && item.timestamp < oneWeekAgo) return false;
    if (
      searchQuery &&
      !item.text.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPrompts = activityItems.length;
  const totalTokensEstimated = Math.round(
    activityItems.reduce((acc, curr) => acc + curr.text.length * 1.3, 0)
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F9FA] dark:bg-[#131418] text-[#1F1F1F] dark:text-[#E3E3E3]">
      {/* Top Header */}
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
              <Clock className="text-[#1A73E8]" size={22} />
              Soul Lost Activity
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Review your queries, prompts, and prompt history across all devices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activityItems.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear your conversation activity?")) {
                  onClearActivity();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-full hover:bg-red-100 transition cursor-pointer border border-red-200 dark:border-red-900"
            >
              <Trash2 size={13} />
              <span>Clear Activity</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Metric summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1e1f20] p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span>Total Prompts</span>
              <MessageSquare size={16} className="text-[#1A73E8]" />
            </div>
            <div className="text-2xl font-bold text-[#1F1F1F] dark:text-white">
              {totalPrompts}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Across {sessions.length} conversations
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1f20] p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span>Estimated Tokens</span>
              <Zap size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-[#1F1F1F] dark:text-white">
              {totalTokensEstimated.toLocaleString()}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Prompt context processed
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1f20] p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span>Privacy Status</span>
              <Sparkles size={16} className="text-[#81A618]" />
            </div>
            <div className="text-2xl font-bold text-[#1F1F1F] dark:text-white">
              Protected
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              End-to-end encrypted storage
            </div>
          </div>
        </div>

        {/* Search and Period Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(["all", "today", "week"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition cursor-pointer ${
                  filterPeriod === period
                    ? "bg-[#1A73E8] text-white"
                    : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:bg-gray-100"
                }`}
              >
                {period === "all" ? "All Time" : period === "today" ? "Today" : "This Week"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompt activity..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full focus:outline-none focus:border-[#1A73E8]"
            />
          </div>
        </div>

        {/* Timeline Stream */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1e1f20] rounded-3xl border border-dashed border-gray-300 dark:border-neutral-700">
              <Clock className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" size={40} />
              <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
                No activity found
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Your future interactions with Soul Lost will be logged here.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1e1f20] rounded-2xl p-4 border border-gray-200 dark:border-neutral-800 hover:border-[#1A73E8]/40 shadow-2xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#1A73E8] truncate max-w-xs">
                      {item.sessionTitle}
                    </span>
                    <span className="text-[11px] text-gray-400">&bull;</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-800 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                    "{item.text}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300">
                    {item.modelUsed}
                  </span>
                  <button
                    onClick={() => onSelectSession(item.sessionId)}
                    className="p-1.5 text-gray-400 hover:text-[#1A73E8] transition"
                    title="Open chat"
                  >
                    <ExternalLink size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
