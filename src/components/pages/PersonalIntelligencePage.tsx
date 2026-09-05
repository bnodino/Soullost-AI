import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Brain,
  Check,
  Globe,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

interface PersonalIntelligencePageProps {
  onBackToChat: () => void;
  onOpenImportMemory: () => void;
  onOpenExportMemory?: () => void;
}

interface MemoryFact {
  id: string;
  fact: string;
  category: "personal" | "preference" | "technical";
  createdAt: string;
}

const DEFAULT_MEMORIES: MemoryFact[] = [
  {
    id: "mem-1",
    fact: "User's name is Jibon Islam, living in Batiaghata, Bangladesh.",
    category: "personal",
    createdAt: "Today",
  },
  {
    id: "mem-2",
    fact: "Interested in full-stack web applications, TypeScript, React, and AI integrations.",
    category: "technical",
    createdAt: "Yesterday",
  },
  {
    id: "mem-3",
    fact: "Prefers responses in English or Bengali depending on the query language.",
    category: "preference",
    createdAt: "3 days ago",
  },
  {
    id: "mem-4",
    fact: "Prefers clean code without redundant explanations and modular architecture.",
    category: "preference",
    createdAt: "Last week",
  },
];

export const PersonalIntelligencePage: React.FC<PersonalIntelligencePageProps> = ({
  onBackToChat,
  onOpenImportMemory,
  onOpenExportMemory,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [userBio, setUserBio] = useState(() => {
    return (
      localStorage.getItem("soullost_user_bio") ||
      localStorage.getItem("fruitfly_user_bio") ||
      "Software developer building web apps and AI-powered interfaces."
    );
  });
  const [responseStyle, setResponseStyle] = useState(() => {
    return (
      localStorage.getItem("soullost_response_style") ||
      localStorage.getItem("fruitfly_response_style") ||
      "Concise, direct, helpful, and provides complete working code examples."
    );
  });
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    return localStorage.getItem("soullost_pref_lang") || localStorage.getItem("fruitfly_pref_lang") || "bilingual";
  });

  const [memories, setMemories] = useState<MemoryFact[]>(() => {
    try {
      const saved = localStorage.getItem("soullost_memories_list") || localStorage.getItem("fruitfly_memories_list");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_MEMORIES;
  });

  const [newFact, setNewFact] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("soullost_memories_list", JSON.stringify(memories));
    } catch (e) {
      console.error(e);
    }
  }, [memories]);

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    const item: MemoryFact = {
      id: `mem-${Date.now()}`,
      fact: newFact.trim(),
      category: "personal",
      createdAt: "Just now",
    };
    setMemories([item, ...memories]);
    setNewFact("");
  };

  const handleDeleteFact = (id: string) => {
    setMemories(memories.filter((m) => m.id !== id));
  };

  const handleSaveAll = () => {
    localStorage.setItem("soullost_user_bio", userBio);
    localStorage.setItem("soullost_response_style", responseStyle);
    localStorage.setItem("soullost_pref_lang", preferredLanguage);
    localStorage.setItem("soullost_memory_enabled", String(enabled));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
              <Sparkles className="text-[#1A73E8]" size={22} />
              Personal Intelligence & Memory
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] inline-block" />
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Customize how Soul Lost remembers your context, goals, and communication preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportMemory}
            className="px-3.5 py-1.5 text-xs font-medium bg-[#E8F0FE] dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#1A73E8] dark:text-[#8AB4F8] rounded-full transition cursor-pointer"
          >
            Export Memory
          </button>
          <button
            onClick={onOpenImportMemory}
            className="px-3.5 py-1.5 text-xs font-medium bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 rounded-full transition cursor-pointer"
          >
            Import Memory
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-[#1A73E8] hover:bg-blue-600 text-white rounded-full transition cursor-pointer shadow-2xs"
          >
            {savedSuccess ? <Check size={14} /> : <Save size={14} />}
            <span>{savedSuccess ? "Saved!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Toggle Card */}
        <div className="bg-white dark:bg-[#1e1f20] p-6 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-white flex items-center gap-2">
              <Brain size={18} className="text-[#1A73E8]" />
              Enable Soul Lost Personal Memory
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-xl">
              When enabled, Soul Lost remembers pertinent context from your conversations to tailor recommendations and reduce repetitive prompts.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]" />
          </label>
        </div>

        {/* User Bio & Tone Custom Instructions */}
        <div className="bg-white dark:bg-[#1e1f20] p-6 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              What should Soul Lost know about you to provide better answers?
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              Your role, skills, project goals, or background.
            </p>
            <textarea
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-gray-200 dark:border-neutral-700 p-3 bg-gray-50 dark:bg-neutral-900 text-xs text-[#1F1F1F] dark:text-[#E3E3E3] outline-none focus:border-[#1A73E8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              How would you like Soul Lost to respond?
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              Tone, format preferences, formatting guidelines.
            </p>
            <textarea
              value={responseStyle}
              onChange={(e) => setResponseStyle(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-gray-200 dark:border-neutral-700 p-3 bg-gray-50 dark:bg-neutral-900 text-xs text-[#1F1F1F] dark:text-[#E3E3E3] outline-none focus:border-[#1A73E8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 block mb-1">
              Primary Language Behavior
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "bilingual", title: "Automatic / Bilingual", desc: "Replies in English or Bengali based on prompt" },
                { id: "english", title: "Always English", desc: "Default to standard international English" },
                { id: "bangla", title: "বাংলা (Bengali)", desc: "বাংলা ভাষায় প্রম্পট ও রেসপন্স প্রধান্য দেওয়া হবে" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreferredLanguage(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    preferredLanguage === opt.id
                      ? "border-[#1A73E8] bg-[#E8F0FE] dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8]"
                      : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 bg-white dark:bg-neutral-900"
                  }`}
                >
                  <div className="text-xs font-semibold mb-0.5">{opt.title}</div>
                  <div className="text-[11px] text-gray-500 dark:text-neutral-400">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Learned Facts List */}
        <div className="bg-white dark:bg-[#1e1f20] p-6 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-white">
                Saved Memory Facts ({memories.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Facts Soul Lost uses in ongoing reasoning. You can add, edit, or remove any item.
              </p>
            </div>
          </div>

          {/* Add fact input */}
          <form onSubmit={handleAddFact} className="flex gap-2">
            <input
              type="text"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              placeholder="E.g., I prefer using Tailwind CSS and Lucide icons..."
              className="flex-1 rounded-full border border-gray-200 dark:border-neutral-700 px-4 py-2 text-xs bg-gray-50 dark:bg-neutral-900 outline-none focus:border-[#1A73E8]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus size={14} />
              <span>Add Fact</span>
            </button>
          </form>

          {/* List of facts */}
          <div className="space-y-2 pt-2">
            {memories.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-neutral-900/80 border border-gray-200/60 dark:border-neutral-800 text-xs text-gray-700 dark:text-neutral-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] shrink-0" />
                  <span>{m.fact}</span>
                </div>
                <button
                  onClick={() => handleDeleteFact(m.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition opacity-60 group-hover:opacity-100 cursor-pointer"
                  title="Remove fact"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Privacy guarantee */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
          <span>
            Your personal intelligence memories are private to your Soul Lost account and are never shared or used to train third-party public models.
          </span>
        </div>
      </div>
    </div>
  );
};
