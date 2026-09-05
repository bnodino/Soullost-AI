import React, { useState } from "react";
import { ArrowRight, Clock, MessageSquare, Search, X } from "lucide-react";
import { ChatSession } from "../../types";

interface SearchChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
}

export const SearchChatsModal: React.FC<SearchChatsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
}) => {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search across titles and message bodies
  const results = trimmed
    ? sessions
        .map((s) => {
          const titleMatch = s.title.toLowerCase().includes(trimmed);
          const matchedMessages = s.messages.filter((m) =>
            m.text.toLowerCase().includes(trimmed)
          );
          if (titleMatch || matchedMessages.length > 0) {
            return {
              session: s,
              matchCount: (titleMatch ? 1 : 0) + matchedMessages.length,
              snippet:
                matchedMessages[0]?.text || s.messages[0]?.text || "No preview",
            };
          }
          return null;
        })
        .filter(Boolean) as {
        session: ChatSession;
        matchCount: number;
        snippet: string;
      }[]
    : [];

  const handleSelect = (id: string) => {
    onSelectSession(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1e1f20] rounded-3xl shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden text-xs text-[#1F1F1F] dark:text-neutral-200">
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-neutral-800 gap-3">
          <Search size={18} className="text-[#1A73E8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Search across all conversations and prompts..."
            className="flex-1 bg-transparent text-sm outline-none text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-gray-500 font-mono text-[11px]"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1.5">
          {!trimmed ? (
            <div className="py-10 text-center text-gray-400 space-y-1">
              <MessageSquare size={32} className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
              <p>Type keywords to search chats and messages</p>
              <p className="text-[11px] text-gray-400">
                Search through titles, questions, code, and answers
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              No conversations found matching "{query}"
            </div>
          ) : (
            results.map(({ session, snippet, matchCount }) => (
              <div
                key={session.id}
                onClick={() => handleSelect(session.id)}
                className="group p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-neutral-800/80 transition cursor-pointer flex items-center justify-between gap-3 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-[#1F1F1F] dark:text-white truncate">
                      {session.title}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-1">
                    {snippet}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 text-[#1A73E8] transition shrink-0">
                  <span className="text-[11px] font-medium">Open</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
