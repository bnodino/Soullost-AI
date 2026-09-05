import React, { useState } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Calendar,
  AlertCircle,
  Tag,
  Cpu,
} from "lucide-react";
import { AppVersion } from "../../types";
import { saveAppVersion, deleteAppVersion } from "../../lib/firebase";

interface AdminVersionsTabProps {
  versions: AppVersion[];
  adminEmail: string;
}

export const AdminVersionsTab: React.FC<AdminVersionsTabProps> = ({
  versions,
  adminEmail,
}) => {
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [changelogInput, setChangelogInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenNew = () => {
    setIsNewVersion(true);
    setEditingVersion({
      id: "v" + Date.now().toString().slice(-4),
      versionNumber: "v2.6.0",
      releaseDate: new Date().toISOString().split("T")[0],
      title: "Enhanced Engine Release",
      changelog: [
        "Upgraded maximum 25,000,000 letters per question context",
        "Refined latency and high-speed streaming pipeline",
      ],
      status: "active",
      recommendedModel: "fruitfly-plus",
      isCurrent: false,
    });
  };

  const handleOpenEdit = (version: AppVersion) => {
    setIsNewVersion(false);
    setEditingVersion({ ...version, changelog: [...version.changelog] });
  };

  const handleDelete = async (versionId: string, versionNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete version "${versionNumber}"?`)) {
      return;
    }
    try {
      await deleteAppVersion(versionId, adminEmail);
      setSuccessMsg(`Version "${versionNumber}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Error deleting version:", err);
      setError(err?.message || "Failed to delete version.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;
    if (!editingVersion.id.trim() || !editingVersion.versionNumber.trim()) {
      setError("Please provide a valid version number and ID.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveAppVersion(editingVersion, adminEmail);
      setSuccessMsg(`Version "${editingVersion.versionNumber}" saved successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingVersion(null);
    } catch (err: any) {
      console.error("Error saving version:", err);
      setError(err?.message || "Failed to save version.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddChangelog = () => {
    if (!changelogInput.trim() || !editingVersion) return;
    setEditingVersion({
      ...editingVersion,
      changelog: [...editingVersion.changelog, changelogInput.trim()],
    });
    setChangelogInput("");
  };

  const handleRemoveChangelog = (idx: number) => {
    if (!editingVersion) return;
    setEditingVersion({
      ...editingVersion,
      changelog: editingVersion.changelog.filter((_, i) => i !== idx),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400";
      case "beta":
        return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400";
      case "deprecated":
        return "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400";
      default:
        return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#181a20] p-5 rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#1F1F1F] dark:text-white flex items-center gap-2">
            <Layers className="text-[#A4C639]" size={18} />
            Soul Lost Releases & Model Version Manager
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            Manage release notes, changelog updates, and version deprecations
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#A4C639] hover:bg-[#92b230] text-white text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>Release New Version</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Version Cards */}
      <div className="space-y-4">
        {versions.map((ver) => (
          <div
            key={ver.id}
            className="bg-white dark:bg-[#181a20] rounded-3xl border border-[#E0E0E0] dark:border-neutral-800 p-5 shadow-xs text-xs space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-mono text-base font-bold text-[#1F1F1F] dark:text-white">
                    {ver.versionNumber}
                  </span>
                  {ver.isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A4C639]/20 text-[#5f7d0e] dark:text-[#A4C639]">
                      CURRENT LIVE
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                      ver.status
                    )}`}
                  >
                    {ver.status}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-[#1F1F1F] dark:text-neutral-200">
                  {ver.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(ver)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ver.id, ver.versionNumber)}
                  title="Delete Version"
                  className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                Released: {ver.releaseDate}
              </span>
              <span className="flex items-center gap-1">
                <Cpu size={13} />
                Recommended Model: <strong className="text-[#1A73E8]">{ver.recommendedModel}</strong>
              </span>
              {ver.minSupportedClient && (
                <span>Min Client: {ver.minSupportedClient}</span>
              )}
            </div>

            {/* Changelog Items */}
            <div className="p-3.5 rounded-2xl bg-[#F0F4F9] dark:bg-[#14151a] border border-gray-100 dark:border-neutral-800">
              <div className="font-semibold text-[11px] text-gray-600 dark:text-neutral-400 mb-2">
                Changelog & Highlights:
              </div>
              <ul className="space-y-1.5">
                {ver.changelog.map((c, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-[11px] text-[#444746] dark:text-neutral-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A4C639] shrink-0 mt-1.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Version Modal */}
      {editingVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#181a20] rounded-3xl border border-[#E0E0E0] dark:border-neutral-800 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-xs text-[#1F1F1F] dark:text-neutral-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-[#1F1F1F] dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-[#A4C639]" />
                {isNewVersion ? "Publish New Version" : `Edit Version: ${editingVersion.versionNumber}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingVersion(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Version & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Version Number (e.g. v2.6.0)
                  </label>
                  <input
                    type="text"
                    value={editingVersion.versionNumber}
                    onChange={(e) =>
                      setEditingVersion({
                        ...editingVersion,
                        versionNumber: e.target.value,
                        id: e.target.value.toLowerCase(),
                      })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={editingVersion.releaseDate}
                    onChange={(e) =>
                      setEditingVersion({ ...editingVersion, releaseDate: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                  Release Title / Headline
                </label>
                <input
                  type="text"
                  value={editingVersion.title}
                  onChange={(e) =>
                    setEditingVersion({ ...editingVersion, title: e.target.value })
                  }
                  className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] font-medium outline-none"
                  placeholder="e.g. Ultra-High Capacity Engine Release"
                />
              </div>

              {/* Status & Recommended Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Release Status
                  </label>
                  <select
                    value={editingVersion.status}
                    onChange={(e) =>
                      setEditingVersion({ ...editingVersion, status: e.target.value as any })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none cursor-pointer"
                  >
                    <option value="active">Active (Production)</option>
                    <option value="beta">Beta / Experimental</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                    Recommended Model
                  </label>
                  <select
                    value={editingVersion.recommendedModel}
                    onChange={(e) =>
                      setEditingVersion({ ...editingVersion, recommendedModel: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none cursor-pointer"
                  >
                    <option value="fruitfly-plus">Soul Lost Plus</option>
                    <option value="fruitfly-pro-lite">Soul Lost Pro Lite</option>
                    <option value="fruitfly-pro">Soul Lost Pro</option>
                  </select>
                </div>
              </div>

              {/* Changelog List */}
              <div>
                <label className="font-semibold block mb-1 text-gray-600 dark:text-neutral-300">
                  Changelog Points ({editingVersion.changelog.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={changelogInput}
                    onChange={(e) => setChangelogInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChangelog();
                      }
                    }}
                    placeholder="Add a new changelog line..."
                    className="flex-1 p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#14151a] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddChangelog}
                    className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-neutral-50 dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800">
                  {editingVersion.changelog.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-[#1e2029] border border-gray-100 dark:border-neutral-700 text-[11px]"
                    >
                      <span className="truncate">{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChangelog(idx)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Is Current */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingVersion.isCurrent || false}
                    onChange={(e) =>
                      setEditingVersion({ ...editingVersion, isCurrent: e.target.checked })
                    }
                    className="accent-[#A4C639] cursor-pointer"
                  />
                  <span className="font-semibold">Mark as Current Production Version</span>
                </label>
              </div>

              {/* Submit / Cancel */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingVersion(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#A4C639] hover:bg-[#92b230] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSaving ? <span>Saving...</span> : <><Check size={14} /><span>Save Version</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
