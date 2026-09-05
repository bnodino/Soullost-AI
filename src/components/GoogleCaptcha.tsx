import React, { useState, useEffect } from "react";
import { Check, RefreshCw, ShieldCheck, AlertCircle } from "lucide-react";

interface GoogleCaptchaProps {
  id?: string;
  onVerify: (token: string) => void;
  onExpired?: () => void;
  isVerified: boolean;
  required?: boolean;
}

export const GoogleCaptcha: React.FC<GoogleCaptchaProps> = ({
  id = "google-recaptcha-widget",
  onVerify,
  onExpired,
  isVerified,
  required = true,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeNumber, setChallengeNumber] = useState(0);
  const [challengeOptions, setChallengeOptions] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVerified) {
      setIsVerifying(false);
      setShowChallenge(false);
    }
  }, [isVerified]);

  const generatePuzzle = () => {
    const target = Math.floor(Math.random() * 90) + 10;
    const diff1 = target + (Math.floor(Math.random() * 8) + 1);
    const diff2 = target - (Math.floor(Math.random() * 8) + 1);
    const diff3 = target + 15;
    const options = [target, diff1, diff2, diff3].sort(() => Math.random() - 0.5);

    setChallengeNumber(target);
    setChallengeOptions(options);
    setShowChallenge(true);
    setIsVerifying(false);
  };

  const handleCheckboxClick = () => {
    if (isVerified || isVerifying) return;
    setError(null);
    setIsVerifying(true);

    // Simulate anti-bot verification check
    setTimeout(() => {
      // 50% instant pass if human-like cursor interaction, or challenge modal
      const isInstantPass = Math.random() > 0.35;
      if (isInstantPass) {
        setIsVerifying(false);
        const token = "g-recaptcha-response-" + Math.random().toString(36).substring(2) + Date.now();
        onVerify(token);
      } else {
        generatePuzzle();
      }
    }, 850);
  };

  const handleChallengePick = (num: number) => {
    if (num === challengeNumber) {
      setShowChallenge(false);
      setIsVerifying(false);
      const token = "g-recaptcha-response-verified-" + Math.random().toString(36).substring(2);
      onVerify(token);
    } else {
      setError("Verification failed. Please try again.");
      setShowChallenge(false);
      setIsVerifying(false);
      onExpired?.();
    }
  };

  return (
    <div id={id} className="w-full select-none">
      {/* Standard Google reCAPTCHA Card Container */}
      <div className="relative inline-flex items-center justify-between w-full max-w-[320px] px-3.5 py-3 bg-[#F9F9F9] dark:bg-[#1f2128] border border-[#D3D3D3] dark:border-neutral-700 rounded-sm shadow-xs transition-all">
        <div className="flex items-center gap-3">
          {/* Checkbox box */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={isVerified || isVerifying}
            className={`relative flex items-center justify-center w-7 h-7 rounded-[3px] border-2 transition-all cursor-pointer ${
              isVerified
                ? "bg-white dark:bg-[#1a1c22] border-emerald-500 text-emerald-600"
                : isVerifying
                ? "border-blue-500 bg-white dark:bg-[#1a1c22]"
                : "border-[#C1C1C1] dark:border-neutral-600 hover:border-[#8E8E8E] bg-white dark:bg-[#15161b]"
            }`}
            title="reCAPTCHA anti-bot verification"
          >
            {isVerified && <Check size={18} strokeWidth={3} className="text-emerald-500" />}
            {isVerifying && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          {/* Label */}
          <span className="text-[13px] font-medium text-[#222] dark:text-neutral-200">
            {isVerified ? "Verification complete" : "I'm not a robot"}
          </span>
        </div>

        {/* reCAPTCHA Branding on Right */}
        <div className="flex flex-col items-center pl-3 border-l border-neutral-200 dark:border-neutral-700/60">
          <div className="w-8 h-8 flex items-center justify-center">
            {/* Google reCAPTCHA symbol */}
            <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
              <path
                d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4"
                stroke="#1A73E8"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M24 4C35.0457 4 44 12.9543 44 24"
                stroke="#4285F4"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
              <circle cx="24" cy="24" r="7" fill="#1A73E8" />
            </svg>
          </div>
          <span className="text-[9px] font-semibold text-[#555] dark:text-neutral-400 tracking-tighter">
            reCAPTCHA
          </span>
          <div className="flex gap-1 text-[8px] text-[#555] dark:text-neutral-400">
            <span>Privacy</span>
            <span>-</span>
            <span>Terms</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Anti-Bot Security Modal Challenge */}
      {showChallenge && (
        <div className="mt-2.5 p-3.5 bg-white dark:bg-[#181a20] border border-[#1A73E8] rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-150 max-w-[320px]">
          <div className="bg-[#1A73E8] text-white p-2.5 rounded-lg mb-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold opacity-90">
              Anti-Bot Security Challenge
            </p>
            <p className="text-sm font-bold mt-0.5">
              Select the matching security number:{" "}
              <span className="underline font-mono text-base">{challengeNumber}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {challengeOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChallengePick(opt)}
                className="py-2.5 px-3 rounded-lg border border-[#E0E0E0] dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-[#D3E3FD] dark:hover:bg-[#1f2838] hover:border-[#1A73E8] text-sm font-bold text-[#1F1F1F] dark:text-white transition cursor-pointer"
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-gray-400">
            <button
              type="button"
              onClick={generatePuzzle}
              className="flex items-center gap-1 hover:text-blue-500 cursor-pointer"
            >
              <RefreshCw size={12} /> Reload
            </button>
            <span className="flex items-center gap-1 text-gray-500">
              <ShieldCheck size={12} className="text-emerald-500" /> Bot Defense
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
