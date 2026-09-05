import React, { useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
  Check,
} from "lucide-react";

interface ImportMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoriesImported?: () => void;
}

export const ImportMemoryModal: React.FC<ImportMemoryModalProps> = ({
  isOpen,
  onClose,
  onMemoriesImported,
}) => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);

    // Extract facts from pasted text
    setTimeout(() => {
      try {
        const lines = inputText
          .split("\n")
          .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
          .filter((l) => l.length > 5);

        const newFacts = lines.slice(0, 10).map((line, idx) => ({
          id: `mem-${Date.now()}-${idx}`,
          fact: line,
          category: "personal",
          createdAt: "Imported today",
        }));

        const existingRaw =
          localStorage.getItem("soullost_memories_list") ||
          localStorage.getItem("fruitfly_memories_list");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const merged = [...newFacts, ...existing];
        localStorage.setItem("soullost_memories_list", JSON.stringify(merged));

        setSuccessCount(newFacts.length);
        setIsProcessing(false);
        onMemoriesImported?.();

        setTimeout(() => {
          setSuccessCount(null);
          setInputText("");
          onClose();
        }, 1500);
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1e1f20] rounded-3xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-6 text-xs text-[#1F1F1F] dark:text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Download className="text-[#1A73E8]" size={18} />
            <h3 className="text-sm font-semibold">Import memory to Soul Lost</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-gray-500 dark:text-neutral-400 leading-relaxed">
            Paste your personal facts, profile notes, or previous ChatGPT / Claude custom instructions below. Soul Lost will parse and integrate them into your Personal Intelligence.
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            placeholder="Paste notes, bio, or custom instructions here... (e.g., 'My name is Jibon Islam, I am a developer in Batiaghata, Bangladesh. I prefer concise answers and TypeScript examples.')"
            className="w-full rounded-2xl border border-gray-200 dark:border-neutral-700 p-3 bg-gray-50 dark:bg-neutral-900 text-[#1F1F1F] dark:text-[#E3E3E3] outline-none focus:border-[#1A73E8] leading-relaxed resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-neutral-200 cursor-pointer">
              <Upload size={14} />
              <span>Or upload .txt / .json file</span>
              <input
                type="file"
                accept=".txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {successCount !== null ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check size={14} /> Imported {successCount} memories!
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 font-medium text-gray-600 dark:text-neutral-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!inputText.trim() || isProcessing}
            onClick={handleImport}
            className="px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Extract & Import</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
