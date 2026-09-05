import React, { useState } from "react";
import { Check, MapPin, Search, X } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
}

const PRESET_LOCATIONS = [
  "Batiaghata, Bangladesh",
  "Khulna, Bangladesh",
  "Dhaka, Bangladesh",
  "Chittagong, Bangladesh",
  "Sylhet, Bangladesh",
  "Rajshahi, Bangladesh",
  "Kolkata, India",
  "Singapore",
  "London, UK",
  "New York, USA",
  "Tokyo, Japan",
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [customLoc, setCustomLoc] = useState("");

  if (!isOpen) return null;

  const handleChoose = (loc: string) => {
    onSelectLocation(loc);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customLoc.trim()) {
      handleChoose(customLoc.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1e1f20] rounded-3xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-6 text-xs text-[#1F1F1F] dark:text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <MapPin className="text-[#1A73E8]" size={18} />
            <h3 className="text-sm font-semibold">Update Your Location</h3>
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
            Soul Lost uses your approximate location to ground local weather, news, and regional knowledge queries.
          </p>

          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customLoc}
              onChange={(e) => setCustomLoc(e.target.value)}
              placeholder="Enter custom city, region..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-neutral-700 px-3 py-2 bg-gray-50 dark:bg-neutral-900 outline-none text-xs"
            />
            <button
              type="submit"
              disabled={!customLoc.trim()}
              className="px-3 py-2 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition cursor-pointer"
            >
              Set
            </button>
          </form>

          <div className="space-y-1 max-h-48 overflow-y-auto pt-1">
            <div className="text-[11px] font-semibold text-gray-400 uppercase mb-1">
              Popular Locations
            </div>
            {PRESET_LOCATIONS.map((loc) => {
              const isSelected = currentLocation === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleChoose(loc)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-950/60 dark:text-[#8AB4F8] font-medium"
                      : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className={isSelected ? "text-[#1A73E8]" : "text-gray-400"} />
                    <span>{loc}</span>
                  </div>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
