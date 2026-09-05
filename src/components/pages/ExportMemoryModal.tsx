import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  FileJson,
  FileText,
  Brain,
  Search,
  ExternalLink,
} from "lucide-react";

interface ExportMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemoryItem {
  id: string;
  fact: string;
  category?: string;
  createdAt?: string;
}

export const ExportMemoryModal: React.FC<ExportMemoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [userBio, setUserBio] = useState("");
  const [responseStyle, setResponseStyle] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "txt">("json");

  useEffect(() => {
    if (!isOpen) return;

    // Load from local storage
    try {
      const raw =
        localStorage.getItem("soullost_memories_list") ||
        localStorage.getItem("fruitfly_memories_list");
      if (raw) {
        setMemories(JSON.parse(raw));
      } else {
        // Fallback default sample memories if empty
        const defaults: MemoryItem[] = [
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
        setMemories(defaults);
        localStorage.setItem("soullost_memories_list", JSON.stringify(defaults));
      }

      setUserBio(
        localStorage.getItem("soullost_user_bio") ||
          localStorage.getItem("fruitfly_user_bio") ||
          "Software developer building web apps and AI-powered interfaces."
      );
      setResponseStyle(
        localStorage.getItem("soullost_response_style") ||
          localStorage.getItem("fruitfly_response_style") ||
          "Concise, direct, helpful, and provides complete working code examples."
      );
    } catch (e) {
      console.error("Error loading memories for export", e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const exportData = {
    app: "Soul Lost AI",
    version: "2.5.0",
    exportDate: new Date().toISOString(),
    profile: {
      bio: userBio,
      communicationStyle: responseStyle,
    },
    totalMemories: memories.length,
    memories: memories,
  };

  const getExportText = () => {
    if (exportFormat === "json") {
      return JSON.stringify(exportData, null, 2);
    } else {
      let text = `# Soul Lost AI Memory Export\n`;
      text += `Generated: ${new Date().toLocaleString()}\n\n`;
      text += `## User Profile\n- Bio: ${userBio}\n- Style: ${responseStyle}\n\n`;
      text += `## Stored Memories (${memories.length} facts)\n`;
      memories.forEach((m, idx) => {
        text += `${idx + 1}. [${m.category || "general"}] ${m.fact} (${m.createdAt || "saved"})\n`;
      });
      return text;
    }
  };

  const handleDownload = () => {
    const content = getExportText();
    const mimeType =
      exportFormat === "json" ? "application/json" : "text/plain";
    const extension = exportFormat === "json" ? "json" : "txt";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soullost-memory-export-${new Date().toISOString().split("T")[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const content = getExportText();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredMemories = memories.filter((m) =>
    m.fact.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1e1f20] rounded-3xl shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden text-xs text-[#1F1F1F] dark:text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E8F0FE] dark:bg-blue-950/60 text-[#1A73E8] flex items-center justify-center">
              <Upload size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-white">
                Export memory to Soul Lost
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                Export and backup your stored personal facts, knowledge, and preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-[#F8F9FA] dark:bg-[#14151a] border border-gray-200/80 dark:border-neutral-800">
              <div className="text-gray-500 text-[11px] mb-1">Total Memories</div>
              <div className="text-xl font-bold text-[#1A73E8]">
                {memories.length}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F9FA] dark:bg-[#14151a] border border-gray-200/80 dark:border-neutral-800">
              <div className="text-gray-500 text-[11px] mb-1">Export Status</div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <Check size={13} /> Ready to Export
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F9FA] dark:bg-[#14151a] border border-gray-200/80 dark:border-neutral-800">
              <div className="text-gray-500 text-[11px] mb-1">Compatibility</div>
              <div className="text-xs font-medium text-gray-700 dark:text-neutral-300 mt-1">
                Soul Lost & Open AI JSON
              </div>
            </div>
          </div>

          {/* Format Selector */}
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[#444746] dark:text-neutral-300">
              Export Format
            </label>
            <div className="flex items-center gap-2 bg-[#F0F4F9] dark:bg-neutral-800 p-1 rounded-full">
              <button
                type="button"
                onClick={() => setExportFormat("json")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  exportFormat === "json"
                    ? "bg-white dark:bg-[#14151a] text-[#1A73E8] shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <FileJson size={13} />
                JSON (.json)
              </button>
              <button
                type="button"
                onClick={() => setExportFormat("txt")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  exportFormat === "txt"
                    ? "bg-white dark:bg-[#14151a] text-[#1A73E8] shadow-xs"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <FileText size={13} />
                Plain Text (.txt)
              </button>
            </div>
          </div>

          {/* Memory Search & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#444746] dark:text-neutral-300">
                Memories Preview ({filteredMemories.length})
              </span>
              <div className="relative w-48">
                <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter memories..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#14151a] text-[11px] outline-none"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#F8F9FA] dark:bg-[#14151a] border border-gray-200 dark:border-neutral-800">
              {filteredMemories.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  No memories match your filter.
                </div>
              ) : (
                filteredMemories.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#1d2028] border border-gray-100 dark:border-neutral-800 flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-800 dark:text-neutral-200 leading-snug">
                        {m.fact}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span className="capitalize px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                          {m.category || "personal"}
                        </span>
                        <span>{m.createdAt || "Saved"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Raw Export Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-gray-500 text-[11px]">
              <span>Export Code Payload</span>
              <span>{new Blob([getExportText()]).size} bytes</span>
            </div>
            <pre className="p-3.5 rounded-2xl bg-[#14151a] text-[#81A618] dark:text-[#A4C639] font-mono text-[11px] overflow-x-auto max-h-32 border border-neutral-800 select-all leading-relaxed">
              {getExportText().slice(0, 1000)}
              {getExportText().length > 1000 && "\n... (truncated for preview)"}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F9] dark:bg-[#171920] border-t border-gray-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#1e1f20] hover:bg-gray-50 dark:hover:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Payload</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-gray-600 dark:text-neutral-400 hover:bg-gray-200/60 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Download size={14} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
