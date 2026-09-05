import React, { useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Link as LinkIcon,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { ChatSession } from "../../types";

interface PublicLinkItem {
  id: string;
  sessionId: string;
  title: string;
  publicUrl: string;
  createdAt: string;
  views: number;
}

interface PublicLinksPageProps {
  sessions: ChatSession[];
  onBackToChat: () => void;
  onSelectSession: (id: string) => void;
}

const DEFAULT_PUBLIC_LINKS: PublicLinkItem[] = [
  {
    id: "pub-1",
    sessionId: "session-1",
    title: "E-commerce Full-Stack System Prompt",
    publicUrl: "https://soullost.ai/share/c94b7f8e-8a",
    createdAt: "Sep 01, 2026",
    views: 48,
  },
  {
    id: "pub-2",
    sessionId: "session-2",
    title: "HTML Multiplayer Blob Game Mechanics",
    publicUrl: "https://soullost.ai/share/3df8a2b1-5e",
    createdAt: "Aug 28, 2026",
    views: 112,
  },
];

export const PublicLinksPage: React.FC<PublicLinksPageProps> = ({
  sessions,
  onBackToChat,
  onSelectSession,
}) => {
  const [links, setLinks] = useState<PublicLinkItem[]>(() => {
    try {
      const saved =
        localStorage.getItem("soullost_public_links") ||
        localStorage.getItem("fruitfly_public_links");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PUBLIC_LINKS;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSessionToShare, setSelectedSessionToShare] = useState<string>("");

  const saveLinks = (newLinks: PublicLinkItem[]) => {
    setLinks(newLinks);
    try {
      localStorage.setItem("soullost_public_links", JSON.stringify(newLinks));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm("Revoke this public link? Anyone with this URL will no longer be able to view it.")) {
      saveLinks(links.filter((l) => l.id !== id));
    }
  };

  const handleCreateShareLink = () => {
    if (!selectedSessionToShare) return;
    const session = sessions.find((s) => s.id === selectedSessionToShare);
    if (!session) return;

    const newLink: PublicLinkItem = {
      id: `pub-${Date.now()}`,
      sessionId: session.id,
      title: session.title,
      publicUrl: `https://soullost.ai/share/${Math.random().toString(36).substring(2, 10)}`,
      createdAt: "Today",
      views: 1,
    };

    saveLinks([newLink, ...links]);
    setSelectedSessionToShare("");
  };

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
              <LinkIcon className="text-[#1A73E8]" size={22} />
              Your Public Shared Links
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Manage all public links you've created to share conversations with others
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Create Public Link Card */}
        <div className="bg-white dark:bg-[#1e1f20] p-6 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-white flex items-center gap-2">
            <Share2 size={16} className="text-[#1A73E8]" />
            Share a conversation via public link
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Anyone with the link can read the conversation in read-only mode or branch it into their own workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <select
              value={selectedSessionToShare}
              onChange={(e) => setSelectedSessionToShare(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 dark:border-neutral-700 px-4 py-2.5 text-xs bg-gray-50 dark:bg-neutral-900 outline-none text-gray-800 dark:text-neutral-200"
            >
              <option value="">Select a chat to share...</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.messages.length} messages)
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateShareLink}
              disabled={!selectedSessionToShare}
              className="px-5 py-2.5 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus size={15} />
              <span>Create Public Link</span>
            </button>
          </div>
        </div>

        {/* Public Links List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-white">
              Active Public Links ({links.length})
            </h3>
          </div>

          {links.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1e1f20] rounded-3xl border border-dashed border-gray-300 dark:border-neutral-700">
              <Globe className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" size={40} />
              <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
                You have no public links yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Share a conversation above to generate a public link.
              </p>
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="bg-white dark:bg-[#1e1f20] rounded-2xl p-4 border border-gray-200 dark:border-neutral-800 shadow-2xs hover:border-[#1A73E8]/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-[#1F1F1F] dark:text-white truncate">
                      {link.title}
                    </h4>
                    <span className="text-[11px] text-gray-400">&bull;</span>
                    <span className="text-[11px] text-gray-400">{link.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#1A73E8] dark:text-[#8AB4F8] truncate">
                    <LinkIcon size={12} />
                    <span className="truncate">{link.publicUrl}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-gray-400 mr-2">
                    <Eye size={13} />
                    <span>{link.views} views</span>
                  </span>

                  <button
                    onClick={() => handleCopy(link.publicUrl, link.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                  >
                    {copiedId === link.id ? (
                      <>
                        <Check size={13} className="text-emerald-500" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    title="Revoke link"
                  >
                    <Trash2 size={15} />
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
