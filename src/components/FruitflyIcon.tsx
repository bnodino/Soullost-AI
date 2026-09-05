import React from "react";

export interface SoulLostIconProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const SoulLostIcon: React.FC<SoulLostIconProps> = ({
  className = "",
  size = 24,
  animate = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className} ${
        animate ? "animate-pulse" : ""
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label="Soul Lost AI Icon"
      >
        <defs>
          <linearGradient id="soulLostCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A4C639" />
            <stop offset="50%" stopColor="#81A618" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="soulLostWingGlow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A4C639" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.45" />
          </linearGradient>
          <filter id="soulLostSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Soul Lost Ethereal Aura Wings */}
        <path
          d="M50 48 C32 20, 10 26, 16 46 C20 60, 42 54, 50 50 Z"
          fill="url(#soulLostWingGlow)"
          opacity="0.8"
        />
        <path
          d="M50 48 C68 20, 90 26, 84 46 C80 60, 58 54, 50 50 Z"
          fill="url(#soulLostWingGlow)"
          opacity="0.8"
        />

        {/* Soul Lost Core Spark */}
        <path
          d="M50 10 C50 32, 68 50, 90 50 C68 50, 50 68, 50 90 C50 68, 32 50, 10 50 C32 50, 50 32, 50 10 Z"
          fill="url(#soulLostCoreGrad)"
          filter="url(#soulLostSoftGlow)"
        />

        {/* Center Brilliant Specular Highlight */}
        <circle cx="50" cy="50" r="4" fill="#FFFFFF" opacity="0.95" />
      </svg>
    </div>
  );
};

// Backwards compatibility alias
export const FruitflyIcon = SoulLostIcon;

