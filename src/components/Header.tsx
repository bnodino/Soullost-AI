import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Globe,
  LogOut,
  Moon,
  PanelLeft,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { ModelOption, UserProfile, GlobalAdminConfig } from "../types";
import { FruitflyIcon } from "./FruitflyIcon";
import { SUPER_ADMIN_EMAIL } from "../lib/firebase";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  models: ModelOption[];
  useSearch: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: "login" | "register") => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
  globalConfig: GlobalAdminConfig;
  onOpenUpgrade?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  selectedModel,
  onSelectModel,
  models,
  useSearch,
  theme,
  onToggleTheme,
  onOpenSettings,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onSignOut,
  globalConfig,
  onOpenUpgrade,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const displayName = currentUser?.displayName || "Jibon Islam";

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-30 flex flex-col w-full bg-transparent">
      {/* Optional Broadcast Announcement Alert Banner */}
      {globalConfig.announcementActive && globalConfig.announcementText && (
        <div
          className={`w-full py-1.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs ${
            globalConfig.announcementType === "critical"
              ? "bg-red-600 text-white"
              : globalConfig.announcementType === "warning"
              ? "bg-amber-500 text-black"
              : "bg-[#041E49] text-[#D3E3FD]"
          }`}
        >
          <span>{globalConfig.announcementText}</span>
        </div>
      )}

      {/* Header bar matching reference image */}
      <header className="flex items-center justify-between h-14 px-4 sm:px-6 bg-transparent">
        {/* Left: When sidebar is collapsed, show expand button & brand */}
        <div className="flex items-center gap-2.5">
          {!sidebarOpen && (
            <div className="flex items-center gap-2.5 animate-in fade-in">
              <button
                id="toggle-sidebar-btn"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                aria-label="Expand sidebar"
                title="Expand menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="4" />
                  <path d="M9 3v18" />
                </svg>
              </button>

              <div
                className="flex items-center gap-2.5 cursor-pointer group select-none"
                onClick={onNewChat}
                title="Soul Lost - Start new conversation"
              >
                {globalConfig.customLogoUrl ? (
                  <img
                    src={globalConfig.customLogoUrl}
                    alt={globalConfig.appName || "Soul Lost"}
                    className="w-6 h-6 rounded-lg object-cover drop-shadow-[0_0_10px_rgba(164,198,57,0.7)]"
                  />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <div className="absolute -inset-1 rounded-full bg-[#A4C639]/40 blur-md group-hover:bg-[#A4C639]/65 transition duration-300 animate-pulse" />
                    <FruitflyIcon size={22} className="relative z-10 drop-shadow-[0_0_8px_rgba(164,198,57,0.8)]" />
                  </div>
                )}
                <div className="relative flex items-center">
                  <span className="text-[19px] font-black tracking-wide soullost-header-glow transition-all duration-300 select-none text-[#1e2a04] dark:text-[#f4ffb8]">
                    {globalConfig.appName || "Soul Lost"}
                  </span>
                  {/* Luminous ethereal radiant highlight backdrop halo */}
                  <div className="absolute -inset-x-3 -inset-y-1.5 rounded-xl bg-gradient-to-r from-[#A4C639]/35 via-[#81A618]/40 to-[#10B981]/30 blur-md -z-10 opacity-80 group-hover:opacity-100 transition animate-pulse pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Active web search indicator */}
          {useSearch && (
            <span className="hidden md:flex items-center gap-1 text-[11px] font-medium text-[#1A73E8] bg-[#E8F0FE] dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full shadow-2xs">
              <Globe size={11} /> Search Grounding
            </span>
          )}
        </div>

        {/* Right: Upgrade pill button & User profile / Quick Action */}
        <div className="flex items-center gap-2.5">
          {/* Admin badge if logged in as admin */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#A4C639]/20 hover:bg-[#A4C639]/30 text-[#5f7d0e] dark:text-[#A4C639] text-xs font-semibold transition cursor-pointer"
              title="Admin Command Center"
            >
              <Shield size={13} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* ✦ Upgrade pill button (Configurable via Admin Panel) */}
          {globalConfig.showUpgradeButton !== false && (
            <button
              id="upgrade-header-btn"
              onClick={onOpenUpgrade}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C2E7FF] hover:bg-[#b0ddfb] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-medium text-xs sm:text-sm transition cursor-pointer shadow-2xs"
            >
              <Sparkles size={14} className="text-[#001D35] dark:text-[#C2E7FF]" />
              <span>Upgrade</span>
            </button>
          )}

          {/* Quick 1-Click Dark/Light Mode Toggle */}
          {globalConfig.showThemeButton !== false && (
            <button
              id="theme-toggle-header-btn"
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun size={17} className="text-amber-400 hover:rotate-45 transition duration-300" />
              ) : (
                <Moon size={17} className="text-gray-600 hover:-rotate-12 transition duration-300" />
              )}
            </button>
          )}

          {/* User profile avatar / quick menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-gray-300 dark:hover:ring-neutral-600 transition cursor-pointer flex items-center justify-center"
              title={displayName}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-white flex items-center justify-center font-semibold text-xs shadow-2xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Quick user dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#1e1f20] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 text-xs text-[#1F1F1F] dark:text-neutral-200">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800">
                  <p className="font-semibold text-xs truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {currentUser?.email || "jibon0757j@gmail.com"}
                  </p>
                </div>
                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onToggleTheme();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    {theme === "dark" ? (
                      <Sun size={14} className="text-gray-500" />
                    ) : (
                      <Moon size={14} className="text-gray-500" />
                    )}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#A4C639]/10 text-[#5f7d0e] dark:text-[#A4C639] font-medium text-left transition cursor-pointer"
                    >
                      <Shield size={14} />
                      <span>Admin Command Center</span>
                    </button>
                  )}
                </div>
                {currentUser ? (
                  <div className="pt-1 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left font-medium transition cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign out</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 border-t border-gray-100 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAuth("login");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[#1A73E8] hover:bg-blue-50 dark:hover:bg-blue-950/20 text-left font-medium transition cursor-pointer"
                    >
                      <User size={14} />
                      <span>Sign in</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};
