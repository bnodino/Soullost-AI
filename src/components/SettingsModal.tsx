import React from "react";
import { Image as ImageIcon, Moon, RotateCcw, Sparkles, Sun, Volume2, X } from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1c1e25] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] dark:border-neutral-800">
          <div className="flex items-center gap-2 font-bold text-base text-[#1F1F1F] dark:text-neutral-100">
            <Sparkles size={18} className="text-[#81A618]" />
            <span>Soul Lost AI Settings</span>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444746] dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Theme */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#444746] dark:text-neutral-400 uppercase tracking-wider block">
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: "dark" })}
                className={`flex items-center justify-center gap-2 p-3 rounded-full border text-xs font-semibold transition cursor-pointer ${
                  settings.theme === "dark"
                    ? "border-[#A4C639] bg-[#A4C639]/15 text-[#5f7d0e] dark:text-[#A4C639]"
                    : "border-[#E0E0E0] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#444746] dark:text-neutral-300"
                }`}
              >
                <Moon size={16} /> Dark Theme
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: "light" })}
                className={`flex items-center justify-center gap-2 p-3 rounded-full border text-xs font-semibold transition cursor-pointer ${
                  settings.theme === "light"
                    ? "border-[#A4C639] bg-[#A4C639]/15 text-[#5f7d0e] dark:text-[#A4C639]"
                    : "border-[#E0E0E0] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#444746] dark:text-neutral-300"
                }`}
              >
                <Sun size={16} /> Clean Light
              </button>
            </div>
          </div>

          {/* Reasoning / Thinking Level */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#444746] dark:text-neutral-400 uppercase tracking-wider block">
              Reasoning & Thinking Depth
            </label>
            <select
              value={settings.thinkingLevel}
              onChange={(e) =>
                onUpdateSettings({ thinkingLevel: e.target.value as any })
              }
              className="w-full p-2.5 rounded-full border border-[#E0E0E0] dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a] text-[#1F1F1F] dark:text-neutral-200 text-xs font-medium outline-none cursor-pointer px-4"
            >
              <option value="HIGH">High (Deepest reasoning, ideal for complex tasks)</option>
              <option value="LOW">Low (Fast reasoning, balanced latency)</option>
              <option value="MINIMAL">Minimal (Direct immediate answers)</option>
              <option value="OFF">Disabled</option>
            </select>
          </div>

          {/* Speech Voice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#444746] dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 size={14} /> Voice Model (Text-To-Speech)
            </label>
            <select
              value={settings.voice}
              onChange={(e) => onUpdateSettings({ voice: e.target.value as any })}
              className="w-full p-2.5 rounded-full border border-[#E0E0E0] dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a] text-[#1F1F1F] dark:text-neutral-200 text-xs font-medium outline-none cursor-pointer px-4"
            >
              <option value="Kore">Kore (Warm, friendly & articulate)</option>
              <option value="Puck">Puck (Enthusiastic & vibrant)</option>
              <option value="Charon">Charon (Calm & thoughtful)</option>
              <option value="Fenrir">Fenrir (Authoritative & deep)</option>
              <option value="Zephyr">Zephyr (Smooth & cheerful)</option>
            </select>
          </div>

          {/* Image Studio Engine */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#444746] dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={14} className="text-orange-500" /> Image Studio Engine (No API Key Required)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ imageModel: "flux" })}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                  settings.imageModel !== "turbo"
                    ? "border-[#A4C639] bg-[#A4C639]/10 text-[#5f7d0e] dark:text-[#A4C639]"
                    : "border-[#E0E0E0] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#444746] dark:text-neutral-300"
                }`}
              >
                <div className="font-semibold">FLUX (Recommended)</div>
                <div className="text-[10px] text-gray-500 dark:text-neutral-400">High photorealism & prompt accuracy</div>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ imageModel: "turbo" })}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                  settings.imageModel === "turbo"
                    ? "border-[#A4C639] bg-[#A4C639]/10 text-[#5f7d0e] dark:text-[#A4C639]"
                    : "border-[#E0E0E0] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#444746] dark:text-neutral-300"
                }`}
              >
                <div className="font-semibold">Turbo Engine</div>
                <div className="text-[10px] text-gray-500 dark:text-neutral-400">Lowest latency, ultra-fast generation</div>
              </button>
            </div>
            <label className="flex items-center gap-2 pt-1 text-xs text-[#444746] dark:text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.imageEnhance !== false}
                onChange={(e) => onUpdateSettings({ imageEnhance: e.target.checked })}
                className="w-4 h-4 rounded text-[#A4C639] focus:ring-[#A4C639] border-gray-300 dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a]"
              />
              <span>AI Prompt Auto-Enhancement (richer details & lighting)</span>
            </label>
          </div>

          {/* Custom System Instruction */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#444746] dark:text-neutral-400 uppercase tracking-wider block">
              Soul Lost Custom Persona / System Instructions
            </label>
            <textarea
              rows={4}
              value={settings.systemInstruction}
              onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
              placeholder="e.g. Always explain like I am five, prioritize bullet points, code in Python..."
              className="w-full p-3.5 rounded-2xl border border-[#E0E0E0] dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a] text-[#1F1F1F] dark:text-neutral-200 text-xs leading-relaxed outline-none resize-none focus:border-[#A4C639]"
            />
            <p className="text-[11px] text-gray-500 dark:text-neutral-400">
              Soul Lost will adopt this demeanor across all messages.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#F0F4F9] dark:bg-[#171920] border-t border-[#E0E0E0] dark:border-neutral-800">
          <button
            type="button"
            onClick={onResetSettings}
            className="flex items-center gap-1.5 text-xs text-[#444746] hover:text-[#1F1F1F] dark:hover:text-neutral-300 transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#A4C639] hover:bg-[#92b230] text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
};
