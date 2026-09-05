import React, { useState } from "react";
import {
  ImageIcon,
  BookOpen,
  Globe,
  Brain,
  Mic,
  Paperclip,
  Sparkles,
  CreditCard,
  LayoutGrid,
  Search,
  Trash2,
  Share2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { GlobalAdminConfig } from "../../types";

interface AdminButtonsTabProps {
  config: GlobalAdminConfig;
  onSaveConfig: (updatedConfig: Partial<GlobalAdminConfig>) => Promise<void>;
  saving: boolean;
  saveSuccess: boolean;
}

interface ButtonItem {
  key: keyof GlobalAdminConfig;
  name: string;
  description: string;
  category: string;
  locations: string[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const BUTTON_REGISTRY: ButtonItem[] = [
  {
    key: "showImagesButton",
    name: "Images Studio Button",
    description: "Controls the 'Images' navigation button in the sidebar and Image Studio tool in chat.",
    category: "Media & Canvas",
    locations: ["Sidebar", "Chat + Menu"],
    icon: ImageIcon,
  },
  {
    key: "showNotebookButton",
    name: "Notebooks Section & Button",
    description: "Controls the 'Notebooks' section, 'New notebook', and 'Untitled notebook' in the sidebar.",
    category: "Media & Canvas",
    locations: ["Sidebar"],
    icon: BookOpen,
  },
  {
    key: "showWebSearchButton",
    name: "Web Search Grounding Button",
    description: "Controls the 'Web search' button in the chat plus menu and header search indicator.",
    category: "AI Capabilities",
    locations: ["Chat + Menu", "Header"],
    icon: Globe,
  },
  {
    key: "showThinkButton",
    name: "Deep Thinking / Reasoning Button",
    description: "Controls the 'Deep thinking' toggle button in the chat plus menu.",
    category: "AI Capabilities",
    locations: ["Chat + Menu"],
    icon: Brain,
  },
  {
    key: "showVoiceButton",
    name: "Voice Dictation / Mic Button",
    description: "Controls the microphone voice speech recognition button in the chat input bar.",
    category: "Input Tools",
    locations: ["Chat Input"],
    icon: Mic,
  },
  {
    key: "showUploadButton",
    name: "File & Photo Upload Button",
    description: "Controls the 'Attach photos & files' button and file selector in the chat plus menu.",
    category: "Input Tools",
    locations: ["Chat + Menu"],
    icon: Paperclip,
  },
  {
    key: "showMemoryButton",
    name: "Personal Intelligence & Memory",
    description: "Controls the 'Personal Intelligence', 'Import memory', and 'Export memory' options.",
    category: "Preferences",
    locations: ["Sidebar Menu"],
    icon: Sparkles,
  },
  {
    key: "showUpgradeButton",
    name: "Upgrade Plan Button",
    description: "Controls the prominent 'Upgrade' pill button in the top header and 'View subscriptions' in sidebar.",
    category: "Billing",
    locations: ["Header", "Sidebar Menu"],
    icon: CreditCard,
  },
  {
    key: "showLibraryButton",
    name: "Library Navigation Button",
    description: "Controls the 'Library' navigation button in the sidebar for saved templates and prompts.",
    category: "Navigation",
    locations: ["Sidebar"],
    icon: LayoutGrid,
  },
  {
    key: "showSearchChatsButton",
    name: "Search Chats Button",
    description: "Controls the 'Search chats' search drawer button in the sidebar navigation.",
    category: "Navigation",
    locations: ["Sidebar"],
    icon: Search,
  },
  {
    key: "showShareButton",
    name: "Share Conversation Button",
    description: "Controls the 'Share' export link button in active chat headers.",
    category: "Collaboration",
    locations: ["Chat Header"],
    icon: Share2,
  },
  {
    key: "showClearAllButton",
    name: "Clear All Chats Button",
    description: "Controls the 'Clear all chats' danger option in the sidebar navigation menu.",
    category: "Maintenance",
    locations: ["Sidebar Menu"],
    icon: Trash2,
  },
];

export const AdminButtonsTab: React.FC<AdminButtonsTabProps> = ({
  config,
  onSaveConfig,
  saving,
  saveSuccess,
}) => {
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    BUTTON_REGISTRY.forEach((item) => {
      const val = config[item.key as keyof GlobalAdminConfig];
      initial[item.key] = val !== false; // defaults to true if undefined
    });
    return initial;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleToggle = (key: string) => {
    setLocalToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleSetAll = (enable: boolean) => {
    const updated: Record<string, boolean> = {};
    BUTTON_REGISTRY.forEach((item) => {
      updated[item.key] = enable;
    });
    setLocalToggles(updated);
    setHasUnsavedChanges(true);
  };

  const handleMinimalPreset = () => {
    // Keeps core chat, hides extra buttons like images, notebooks, upgrade, etc.
    const minimal: Record<string, boolean> = {
      showImagesButton: false,
      showNotebookButton: false,
      showWebSearchButton: true,
      showThinkButton: true,
      showVoiceButton: true,
      showUploadButton: true,
      showMemoryButton: false,
      showUpgradeButton: false,
      showLibraryButton: false,
      showSearchChatsButton: true,
      showShareButton: true,
      showClearAllButton: true,
    };
    setLocalToggles(minimal);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    const payload: Partial<GlobalAdminConfig> = {};
    BUTTON_REGISTRY.forEach((item) => {
      (payload as any)[item.key] = localToggles[item.key];
    });
    await onSaveConfig(payload);
    setHasUnsavedChanges(false);
  };

  const visibleCount = Object.values(localToggles).filter(Boolean).length;
  const hiddenCount = BUTTON_REGISTRY.length - visibleCount;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-[#181a20] p-6 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders size={20} className="text-[#81A618]" />
              <h2 className="text-base font-bold text-[#1F1F1F] dark:text-white">
                Button & Feature Visibility Control
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              Admins can show, hide, or remove any button or feature across the application in real time (e.g. hide Images button, remove Notebooks, disable Upgrade pill).
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold animate-in fade-in">
                <CheckCircle2 size={15} />
                Saved to live app!
              </span>
            )}
            <button
              id="admin-save-buttons-btn"
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition cursor-pointer shadow-xs ${
                hasUnsavedChanges
                  ? "bg-[#A4C639] hover:bg-[#92b230] text-white animate-pulse"
                  : "bg-[#D3E3FD] text-[#041E49] hover:bg-[#c2d7f8] dark:bg-[#283549] dark:text-[#D3E3FD]"
              }`}
            >
              <Save size={15} />
              <span>{saving ? "Saving..." : hasUnsavedChanges ? "Save Button Settings" : "Save All Changes"}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
              {visibleCount} Visible
            </span>
            {hiddenCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold">
                {hiddenCount} Hidden / Removed
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                <AlertCircle size={12} />
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSetAll(true)}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-medium cursor-pointer"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={handleMinimalPreset}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-medium cursor-pointer"
            >
              Minimal Preset (Hide Images/Notebooks/Upgrade)
            </button>
            <button
              type="button"
              onClick={() => handleSetAll(false)}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-red-600 dark:text-red-400 font-medium cursor-pointer"
            >
              Hide All Optional
            </button>
          </div>
        </div>
      </div>

      {/* Button Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUTTON_REGISTRY.map((item) => {
          const isVisible = localToggles[item.key] !== false;
          const IconComponent = item.icon;

          return (
            <div
              key={item.key}
              id={`button-setting-${item.key}`}
              className={`p-4 rounded-2xl border transition ${
                isVisible
                  ? "bg-white dark:bg-[#181a20] border-[#E0E0E0] dark:border-neutral-800"
                  : "bg-gray-50/70 dark:bg-[#14151a]/70 border-red-200 dark:border-red-950/50 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isVisible
                        ? "bg-[#A4C639]/15 text-[#5f7d0e] dark:text-[#A4C639]"
                        : "bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400"
                    }`}
                  >
                    <IconComponent size={20} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#1F1F1F] dark:text-white">
                        {item.name}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isVisible
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                      >
                        {isVisible ? "Active" : "Hidden"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-medium">
                        Shown in:
                      </span>
                      {item.locations.map((loc, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 font-mono"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  id={`toggle-btn-${item.key}`}
                  onClick={() => handleToggle(item.key)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    isVisible ? "bg-[#A4C639]" : "bg-gray-300 dark:bg-neutral-700"
                  }`}
                  aria-label={`Toggle ${item.name}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                      isVisible ? "translate-x-6.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
