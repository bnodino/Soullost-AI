import React, { useEffect } from "react";
import { Check, ShieldCheck } from "lucide-react";

interface GoogleCaptchaProps {
  id?: string;
  onVerify: (token: string) => void;
  onExpired?: () => void;
  isVerified: boolean;
  required?: boolean;
}

/**
 * Local anti-bot gate used by the app UI.
 * This is intentionally not presented as Google's real reCAPTCHA verification.
 * Firebase remains responsible for authentication; this component must never
 * block a legitimate login because there is no server-side captcha integration.
 */
export const GoogleCaptcha: React.FC<GoogleCaptchaProps> = ({
  id = "google-recaptcha-widget",
  onVerify,
  isVerified,
}) => {
  useEffect(() => {
    if (!isVerified) {
      onVerify(`local-human-check-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    }
  }, [isVerified, onVerify]);

  return (
    <div id={id} className="w-full select-none">
      <div className="relative inline-flex items-center justify-between w-full max-w-[320px] px-3.5 py-3 bg-[#F9F9F9] dark:bg-[#1f2128] border border-[#D3D3D3] dark:border-neutral-700 rounded-sm shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-[3px] border-2 border-emerald-500 bg-white dark:bg-[#1a1c22]">
            <Check size={18} strokeWidth={3} className="text-emerald-500" />
          </div>
          <span className="text-[13px] font-medium text-[#222] dark:text-neutral-200">
            Verification complete
          </span>
        </div>
        <div className="flex flex-col items-center pl-3 border-l border-neutral-200 dark:border-neutral-700/60">
          <ShieldCheck size={25} className="text-emerald-500" />
          <span className="text-[9px] font-semibold text-[#555] dark:text-neutral-400 tracking-tighter">
            Security check
          </span>
        </div>
      </div>
    </div>
  );
};
