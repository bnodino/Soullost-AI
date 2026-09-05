import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
} from "../lib/firebase";
import { GoogleCaptcha } from "./GoogleCaptcha";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  requireCaptcha?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
  requireCaptcha = true,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setCaptchaToken(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      setSuccessMsg("Signed in with Google successfully!");
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        console.warn("Google sign-in popup was closed by user or cancelled.");
        setError(
          "Google sign-in window was closed. If popups are blocked by your browser, please allow popups or use email sign in below."
        );
      } else if (err.code === "auth/popup-blocked") {
        console.warn("Google sign-in popup was blocked by browser/iframe.");
        setError("Sign-in popup was blocked by browser. Please allow popups or use email sign in below.");
      } else {
        console.warn("Google sign-in notice:", err.message || err);
        setError(err.message || "Failed to sign in with Google. You can sign in with your email below.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Anti-bot check
    if (requireCaptcha && !captchaToken) {
      setError("Please complete the Google reCAPTCHA anti-bot verification.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        setSuccessMsg("Welcome back! Signed in successfully.");
      } else {
        await registerWithEmail(email, password, displayName || email.split("@")[0]);
        setSuccessMsg("Account created! You are now logged in.");
      }

      setTimeout(() => {
        onClose();
        resetForm();
      }, 500);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again or create an account.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="soullost-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="soullost-auth-modal"
        className="w-full max-w-md bg-white dark:bg-[#181a20] rounded-[28px] border border-[#E0E0E0] dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A4C639] to-[#81A618] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              S
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F] dark:text-white">
                {mode === "login" ? "Sign in to Soul Lost" : "Create Soul Lost Account"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Access your chat sessions, image studio & features
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Quick Sign in with Google Button */}
          <div>
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-white dark:bg-[#20222a] hover:bg-[#F8F9FA] dark:hover:bg-[#252833] text-[#1F1F1F] dark:text-white font-semibold text-sm transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin text-blue-500" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#E0E0E0] dark:border-neutral-800"></div>
            <span className="flex-shrink mx-3 text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
              or with email
            </span>
            <div className="flex-grow border-t border-[#E0E0E0] dark:border-neutral-800"></div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                  Full Name / Username
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Smith"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639] transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639] transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639] transition"
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#444746] dark:text-neutral-300 block">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#D3D3D3] dark:border-neutral-700 bg-[#F8F9FA] dark:bg-[#14151a] text-sm text-[#1F1F1F] dark:text-white outline-none focus:border-[#A4C639] transition"
                  />
                </div>
              </div>
            )}

            {/* Google Captcha anti-bot verification widget */}
            {requireCaptcha && (
              <div className="pt-1">
                <GoogleCaptcha
                  id="auth-google-recaptcha"
                  isVerified={!!captchaToken}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading || googleLoading || (requireCaptcha && !captchaToken)}
              className={`w-full py-3 rounded-full font-bold text-sm text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                loading || (requireCaptcha && !captchaToken)
                  ? "bg-gray-400 dark:bg-neutral-700 cursor-not-allowed"
                  : "bg-[#A4C639] hover:bg-[#92b230]"
              }`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="text-center pt-2 border-t border-[#E0E0E0] dark:border-neutral-800">
            {mode === "login" ? (
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    resetForm();
                  }}
                  className="font-bold text-[#81A618] dark:text-[#A4C639] hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    resetForm();
                  }}
                  className="font-bold text-[#81A618] dark:text-[#A4C639] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
