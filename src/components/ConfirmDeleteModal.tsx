import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = "Delete Chat?",
  message = "Are you sure you want to delete this chat conversation? This action cannot be undone.",
  itemName,
  confirmText = "Yes",
  cancelText = "No",
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="confirm-delete-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="confirm-delete-dialog"
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-neutral-700 shadow-2xl p-6 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Warning / Trash Icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
          <Trash2 size={24} />
        </div>

        {/* Title */}
        <h3
          id="confirm-delete-title"
          className="text-lg font-bold text-[#1F1F1F] dark:text-white"
        >
          {title}
        </h3>

        {/* Item preview badge if present */}
        {itemName && (
          <div className="mt-2 p-2 rounded-xl bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 text-xs font-medium text-gray-700 dark:text-neutral-300 truncate">
            &ldquo;{itemName}&rdquo;
          </div>
        )}

        {/* Descriptive Message */}
        <p className="text-xs text-[#444746] dark:text-neutral-300 mt-2 leading-relaxed">
          {message}
        </p>

        {/* Yes / No Action Buttons */}
        <div className="flex items-center gap-2.5 mt-6">
          <button
            id="confirm-delete-no-btn"
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-full border border-gray-300 dark:border-neutral-700 text-xs font-semibold text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer text-center"
          >
            {cancelText}
          </button>
          <button
            id="confirm-delete-yes-btn"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
