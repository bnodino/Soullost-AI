import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Download,
  Edit3,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

interface Notebook {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface NotebookPageProps {
  onBackToChat: () => void;
}

const DEFAULT_NOTEBOOKS: Notebook[] = [
  {
    id: "nb-1",
    title: "Untitled notebook",
    content: `# Soul Lost Research & Ideas\n\nWelcome to your interactive Soul Lost Notebook! You can use this space for:\n\n- Drafting project specifications and product ideas\n- Code architecture scratchpads\n- Brainstorming notes with AI assistance\n\n### Next Steps:\n1. Click "+ New notebook" to create fresh scratchpads.\n2. Use the AI action buttons above to summarize, improve tone, or continue writing.`,
    updatedAt: Date.now(),
  },
];

export const NotebookPage: React.FC<NotebookPageProps> = ({ onBackToChat }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    try {
      const saved =
        localStorage.getItem("soullost_notebooks") ||
        localStorage.getItem("fruitfly_notebooks");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_NOTEBOOKS;
  });

  const [activeId, setActiveId] = useState<string>(
    notebooks[0]?.id || "nb-1"
  );
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiActionMessage, setAiActionMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentNotebook =
    notebooks.find((n) => n.id === activeId) || notebooks[0];

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("soullost_notebooks", JSON.stringify(notebooks));
    } catch (e) {
      console.error(e);
    }
  }, [notebooks]);

  const updateCurrentNotebook = (updates: Partial<Notebook>) => {
    if (!currentNotebook) return;
    setNotebooks((prev) =>
      prev.map((nb) =>
        nb.id === currentNotebook.id
          ? { ...nb, ...updates, updatedAt: Date.now() }
          : nb
      )
    );
  };

  const handleCreateNew = () => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      title: "New Notebook",
      content: "# Title\n\nStart writing here...",
      updatedAt: Date.now(),
    };
    setNotebooks((prev) => [newNb, ...prev]);
    setActiveId(newNb.id);
  };

  const handleDelete = (id: string) => {
    if (notebooks.length <= 1) {
      alert("You need at least one notebook.");
      return;
    }
    const filtered = notebooks.filter((n) => n.id !== id);
    setNotebooks(filtered);
    if (activeId === id) {
      setActiveId(filtered[0]?.id || "");
    }
  };

  // AI Assistance: Summarize, Fix Grammar, Continue writing
  const handleAiAction = async (actionType: "continue" | "summarize" | "grammar" | "outline") => {
    if (!currentNotebook?.content?.trim() || isAiProcessing) return;
    setIsAiProcessing(true);
    setAiActionMessage(null);

    let instruction = "";
    if (actionType === "continue") {
      instruction = "Continue writing this text seamlessly with relevant detail, keeping the same voice and style:";
    } else if (actionType === "summarize") {
      instruction = "Provide a clean, bulleted executive summary of the key points in this text:";
    } else if (actionType === "grammar") {
      instruction = "Proofread, fix any grammar or spelling mistakes, and polish the phrasing of this text:";
    } else if (actionType === "outline") {
      instruction = "Create a structured, detailed outline based on the topics discussed in this text:";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `${instruction}\n\n"""\n${currentNotebook.content}\n"""`,
            },
          ],
          model: "soullost-plus",
        }),
      });

      if (!res.ok) throw new Error("Failed to process AI notebook request");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiResult = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  aiResult += parsed.text;
                }
              } catch (e) {}
            }
          }
        }
      }

      if (aiResult) {
        if (actionType === "continue") {
          updateCurrentNotebook({
            content: `${currentNotebook.content}\n\n${aiResult.trim()}`,
          });
        } else if (actionType === "grammar") {
          updateCurrentNotebook({ content: aiResult.trim() });
        } else {
          updateCurrentNotebook({
            content: `${currentNotebook.content}\n\n---\n### AI ${actionType.toUpperCase()}:\n${aiResult.trim()}`,
          });
        }
        setAiActionMessage(`AI ${actionType} completed!`);
        setTimeout(() => setAiActionMessage(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setAiActionMessage("Failed to reach AI assistant. Please try again.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const wordCount = currentNotebook?.content
    ? currentNotebook.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = currentNotebook?.content?.length || 0;

  const handleDownload = () => {
    if (!currentNotebook) return;
    const blob = new Blob([currentNotebook.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentNotebook.title.toLowerCase().replace(/\s+/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!currentNotebook) return;
    navigator.clipboard.writeText(currentNotebook.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA] dark:bg-[#131418] text-[#1F1F1F] dark:text-[#E3E3E3]">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-neutral-800 bg-white dark:bg-[#1e1f20]">
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
              <BookOpen className="text-[#1A73E8]" size={22} />
              Soul Lost Notebook
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Interactive workspace for research notes, thoughts, and AI co-writing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#1A73E8] text-white rounded-full hover:bg-blue-600 transition cursor-pointer shadow-2xs"
          >
            <Plus size={14} />
            <span>New Notebook</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            title="Export Markdown"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            title="Copy Note"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Main Body: Sidebar list + Main Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notebooks Sub-Sidebar */}
        <div className="w-64 border-r border-[#E5E7EB] dark:border-neutral-800 bg-white dark:bg-[#181a20] flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-100 dark:border-neutral-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Your Notebooks ({notebooks.length})
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notebooks.map((nb) => {
              const isSelected = nb.id === activeId;
              return (
                <div
                  key={nb.id}
                  onClick={() => setActiveId(nb.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-[#E8F0FE] dark:bg-blue-950/60 text-[#1A73E8] dark:text-[#8AB4F8]"
                      : "text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="shrink-0 text-gray-400" />
                    <span className="truncate">{nb.title}</span>
                  </div>

                  {notebooks.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(nb.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
                      title="Delete notebook"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1e1f20]">
          {/* AI Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/70 dark:bg-neutral-900/40 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-400 mr-1 flex items-center gap-1">
                <Sparkles size={13} className="text-[#1A73E8]" /> AI Tools:
              </span>

              <button
                disabled={isAiProcessing}
                onClick={() => handleAiAction("continue")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-[#1A73E8] hover:text-[#1A73E8] transition cursor-pointer disabled:opacity-50"
              >
                ✦ Continue writing
              </button>
              <button
                disabled={isAiProcessing}
                onClick={() => handleAiAction("summarize")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-[#1A73E8] hover:text-[#1A73E8] transition cursor-pointer disabled:opacity-50"
              >
                ✦ Summarize
              </button>
              <button
                disabled={isAiProcessing}
                onClick={() => handleAiAction("grammar")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-[#1A73E8] hover:text-[#1A73E8] transition cursor-pointer disabled:opacity-50"
              >
                ✦ Polish & Fix
              </button>
              <button
                disabled={isAiProcessing}
                onClick={() => handleAiAction("outline")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-[#1A73E8] hover:text-[#1A73E8] transition cursor-pointer disabled:opacity-50"
              >
                ✦ Outline
              </button>
            </div>

            {isAiProcessing && (
              <div className="flex items-center gap-2 text-xs text-[#1A73E8]">
                <Loader2 size={13} className="animate-spin" />
                <span>Soul Lost is writing...</span>
              </div>
            )}

            {aiActionMessage && !isAiProcessing && (
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {aiActionMessage}
              </div>
            )}
          </div>

          {/* Title Editor */}
          <div className="px-8 pt-6 pb-2">
            <input
              type="text"
              value={currentNotebook?.title || ""}
              onChange={(e) => updateCurrentNotebook({ title: e.target.value })}
              placeholder="Notebook Title"
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-gray-300 dark:placeholder:text-neutral-600"
            />
          </div>

          {/* Content Textarea */}
          <div className="flex-1 px-8 py-2 overflow-y-auto">
            <textarea
              value={currentNotebook?.content || ""}
              onChange={(e) => updateCurrentNotebook({ content: e.target.value })}
              placeholder="Write anything or ask Soul Lost to outline ideas..."
              className="w-full h-full min-h-[400px] resize-none bg-transparent outline-none border-none text-[15px] leading-relaxed text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-gray-400 font-mono"
            />
          </div>

          {/* Bottom Word & Character counter */}
          <div className="px-8 py-3 border-t border-gray-100 dark:border-neutral-800 text-xs text-gray-400 flex items-center justify-between">
            <span>
              {wordCount} words &bull; {charCount} characters
            </span>
            <span>Saved locally automatically</span>
          </div>
        </div>
      </div>
    </div>
  );
};
