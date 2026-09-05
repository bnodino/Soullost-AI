import React, { useState } from "react";
import { Check, Loader2, MessageSquare, Star, X } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [category, setCategory] = useState<"bug" | "feature" | "general">("feature");
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState(userEmail || "jibon0757j@gmail.com");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFeedback("");
        onClose();
      }, 1800);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1e1f20] rounded-3xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-6 text-xs text-[#1F1F1F] dark:text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-[#1A73E8]" size={18} />
            <h3 className="text-sm font-semibold">Send feedback to Soul Lost</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <h4 className="text-base font-bold text-[#1F1F1F] dark:text-white">
              Thank you for your feedback!
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Your insights help us refine and elevate the Soul Lost intelligence platform.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {/* Category selection */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase">
                Feedback Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "feature", label: "Idea / Feature" },
                  { id: "bug", label: "Bug Report" },
                  { id: "general", label: "Experience" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      category === cat.id
                        ? "border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-950/60 dark:text-[#8AB4F8] font-medium"
                        : "border-gray-200 dark:border-neutral-700 hover:border-gray-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase">
                Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition hover:scale-110"
                  >
                    <Star
                      size={20}
                      className={
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 dark:text-neutral-600"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase">
                Your Comments & Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                required
                placeholder="Tell us what you liked or what needs improvement..."
                className="w-full rounded-2xl border border-gray-200 dark:border-neutral-700 p-3 bg-gray-50 dark:bg-neutral-900 outline-none focus:border-[#1A73E8] text-xs resize-none leading-relaxed"
              />
            </div>

            {/* Email field */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase">
                Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-neutral-700 px-3 py-2 bg-gray-50 dark:bg-neutral-900 outline-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 font-medium text-gray-600 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!feedback.trim() || isSubmitting}
                className="px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Send Feedback</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
