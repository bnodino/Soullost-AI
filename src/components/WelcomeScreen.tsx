import React from "react";
import { GlobalAdminConfig } from "../types";

interface WelcomeScreenProps {
  children?: React.ReactNode;
  onSelectPrompt?: (prompt: string, isImage?: boolean, useSearch?: boolean) => void;
  globalConfig: GlobalAdminConfig;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  children,
  globalConfig,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full relative min-h-[70vh]">
      {/* Soft Ambient Radial Sky-Blue Glow matching image.png */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="w-[600px] h-[350px] rounded-full bg-radial from-[#D3E3FD]/50 via-[#E8F0FE]/25 to-transparent dark:from-[#1e3a5f]/25 dark:via-transparent dark:to-transparent blur-3xl opacity-80" />
      </div>

      {/* Centered Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[760px] mx-auto text-center mb-6">
        {/* Main Headline from reference image */}
        <h1 className="text-3xl sm:text-4xl md:text-[38px] font-normal tracking-tight text-[#1F1F1F] dark:text-[#E3E3E3] mb-6 sm:mb-8">
          Any new ideas to explore?
        </h1>

        {/* The Centered Floating Prompt Input Bar */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
