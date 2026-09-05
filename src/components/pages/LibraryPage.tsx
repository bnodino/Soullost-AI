import React, { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  Code,
  Download,
  ExternalLink,
  FolderOpen,
  MessageSquare,
  Pin,
  Search,
  Sparkles,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { ChatSession } from "../../types";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";

interface LibraryPageProps {
  sessions: ChatSession[];
  onBackToChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  onUsePromptInChat: (prompt: string) => void;
}

const CURATED_PROMPTS = [
  {
    category: "Coding & Tech",
    title: "Full-Stack API Design",
    prompt: "Design a production-grade TypeScript Express REST API with error middleware, Zod schema validation, and JWT authentication.",
  },
  {
    category: "Coding & Tech",
    title: "React Component Optimization",
    prompt: "Analyze this React component for performance bottlenecks, re-renders, and memoization opportunities with practical refactoring steps.",
  },
  {
    category: "Productivity",
    title: "Executive Summary & Key Takeaways",
    prompt: "Summarize the following document into bulleted executive key takeaways, risk factors, and next actionable steps.",
  },
  {
    category: "Creative",
    title: "Interactive Game Pitch",
    prompt: "Generate 5 unique browser multiplayer game concepts with mechanics, loops, and visual art direction.",
  },
  {
    category: "Bangla / Language",
    title: "বাংলা টেক্সট প্রুফরিডিং ও সারসংক্ষেপ",
    prompt: "নিচের বাংলা টেক্সটটি প্রুফরিড করে ব্যাকরণগত ভুল ঠিক করুন এবং ৩টি মূল পয়েন্টে সারসংক্ষেপ লিখুন।",
  },
];

export const LibraryPage: React.FC<LibraryPageProps> = ({
  sessions,
  onBackToChat,
  onSelectSession,
  onDeleteSession,
  onTogglePinSession,
  onUsePromptInChat,
}) => {
  const [activeTab, setActiveTab] = useState<"chats" | "prompts" | "bookmarks">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);

  // Filtered chats
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Extract all messages with code blocks or user bookmarks
  const allMessagesWithBookmarks = sessions.flatMap((s) =>
    s.messages
      .filter((m) => m.feedback === "like" || m.text.includes("```"))
      .map((m) => ({ ...m, sessionTitle: s.title, sessionId: s.id }))
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportAll = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soullost-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F9FA] dark:bg-[#131418] text-[#1F1F1F] dark:text-[#E3E3E3]">
      {/* Top Header Bar */}
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
              <FolderOpen className="text-[#1A73E8]" size={22} />
              Soul Lost Library
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Browse your saved conversations, prompt templates, and bookmarked insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <Download size={14} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("chats")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                activeTab === "chats"
                  ? "bg-[#1A73E8] text-white"
                  : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700"
              }`}
            >
              <MessageSquare size={14} />
              <span>Saved Chats ({sessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("prompts")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                activeTab === "prompts"
                  ? "bg-[#1A73E8] text-white"
                  : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700"
              }`}
            >
              <Sparkles size={14} />
              <span>Prompt Templates ({CURATED_PROMPTS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                activeTab === "bookmarks"
                  ? "bg-[#1A73E8] text-white"
                  : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700"
              }`}
            >
              <Bookmark size={14} />
              <span>Code & Highlights ({allMessagesWithBookmarks.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter library items..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full focus:outline-none focus:border-[#1A73E8]"
            />
          </div>
        </div>

        {/* Tab 1: Saved Chats */}
        {activeTab === "chats" && (
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1e1f20] rounded-3xl border border-dashed border-gray-300 dark:border-neutral-700">
                <MessageSquare className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" size={40} />
                <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
                  No conversations match your filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-[#1e1f20] rounded-2xl p-4 border border-gray-200 dark:border-neutral-800 hover:border-[#1A73E8]/50 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-white line-clamp-1">
                          {session.title}
                        </h3>
                        {session.pinned && (
                          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                            Pinned
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 mb-3">
                        {session.messages[0]?.text || "No messages in this chat yet."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800 text-xs">
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </span>
                        <span>{session.messages.length} messages</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onTogglePinSession(session.id)}
                          className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                          title="Pin conversation"
                        >
                          <Pin size={14} className={session.pinned ? "fill-amber-500 text-amber-500" : ""} />
                        </button>
                        <button
                          onClick={() => onSelectSession(session.id)}
                          className="px-3 py-1 bg-[#1A73E8] hover:bg-blue-600 text-white font-medium rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => setSessionToDelete(session)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                          title="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Curated Prompt Templates */}
        {activeTab === "prompts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CURATED_PROMPTS.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#1e1f20] rounded-2xl p-5 border border-gray-200 dark:border-neutral-800 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1A73E8] dark:text-[#8AB4F8]">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleCopy(item.prompt, `prompt-${idx}`)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
                      title="Copy prompt"
                    >
                      {copiedId === `prompt-${idx}` ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed bg-gray-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-gray-100 dark:border-neutral-800/80">
                    "{item.prompt}"
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => onUsePromptInChat(item.prompt)}
                    className="px-4 py-1.5 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles size={13} />
                    <span>Run with Soul Lost</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Code & Highlights */}
        {activeTab === "bookmarks" && (
          <div className="space-y-4">
            {allMessagesWithBookmarks.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1e1f20] rounded-3xl border border-dashed border-gray-300 dark:border-neutral-700">
                <Bookmark className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" size={40} />
                <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
                  No code blocks or favorited messages yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Like a message in chat to bookmark it here for quick reference.
                </p>
              </div>
            ) : (
              allMessagesWithBookmarks.map((msg, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1e1f20] rounded-2xl p-5 border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1A73E8]">
                      From: {msg.sessionTitle}
                    </span>
                    <button
                      onClick={() => onSelectSession(msg.sessionId)}
                      className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 flex items-center gap-1 transition"
                    >
                      <span>Jump to Chat</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-700 dark:text-neutral-300 line-clamp-4 bg-gray-50 dark:bg-neutral-900 p-3 rounded-xl font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for deleting a chat */}
      <ConfirmDeleteModal
        isOpen={!!sessionToDelete}
        title="Delete conversation?"
        message="Are you sure you want to delete this chat session? This action cannot be undone."
        itemName={sessionToDelete?.title}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        onConfirm={() => {
          if (sessionToDelete) {
            onDeleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onClose={() => setSessionToDelete(null)}
      />
    </div>
  );
};

