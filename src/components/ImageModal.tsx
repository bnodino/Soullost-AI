import React from "react";
import { Download, ExternalLink, X } from "lucide-react";

interface ImageModalProps {
  imageUrl: string | null;
  prompt?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, prompt, onClose }) => {
  if (!imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `soullost-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center bg-[#181a20] border border-neutral-700/60 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full px-4 py-3 border-b border-neutral-800 bg-[#1e2027]">
          <span className="text-sm font-medium text-neutral-300 truncate max-w-[70%]">
            {prompt || "Soul Lost Image"}
          </span>
          <div className="flex items-center gap-2">
            <button
              id="download-image-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            <button
              id="close-image-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              aria-label="Close image preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto flex items-center justify-center max-h-[calc(90vh-100px)]">
          <img
            src={imageUrl}
            alt={prompt || "Soul Lost preview"}
            className="rounded-lg object-contain max-h-full max-w-full shadow-lg"
            referrerPolicy="no-referrer"
          />
        </div>

        {prompt && (
          <div className="w-full px-4 py-2.5 bg-[#14161b] border-t border-neutral-800 text-xs text-neutral-400 text-center">
            "{prompt}"
          </div>
        )}
      </div>
    </div>
  );
};
