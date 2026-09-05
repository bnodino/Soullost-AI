import React, { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  HelpCircle,
  Keyboard,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

interface HelpPageProps {
  onBackToChat: () => void;
  onOpenFeedback: () => void;
}

const FAQS = [
  {
    q: "What is Soul Lost and how does it work?",
    a: "Soul Lost is an AI intelligence suite designed for ultra-fast conversational reasoning, multimodal analysis, live web search grounding, coding scratchpads, and image generation.",
  },
  {
    q: "What is the difference between Flash and Flash-Lite?",
    a: "Soul Lost 3.1 Flash-Lite offers the lowest latency for quick questions, formatting, and chats. Soul Lost 3.8 Flash provides expanded reasoning, deep thinking logic, and vision understanding.",
  },
  {
    q: "How does Search Grounding work?",
    a: "When Search Grounding is toggled on, Soul Lost consults live web search results and includes clickable source chips at the bottom of its answers so you can verify facts.",
  },
  {
    q: "How do I create images?",
    a: "Click on the Images tab in the sidebar or toggle Image Studio in the prompt input to generate high-resolution visual art and illustrations.",
  },
  {
    q: "Can I use Soul Lost in Bengali (বাংলা)?",
    a: "Yes! Soul Lost has native multilingual understanding and can converse, summarize, write stories, or debug code in Bengali fluently.",
  },
  {
    q: "How is my conversation data protected?",
    a: "Your chats, notebooks, and personal memories are securely saved in your personal workspace and are never shared publicly without your explicit consent.",
  },
];

const SHORTCUTS = [
  { keys: ["Enter"], desc: "Send message" },
  { keys: ["Shift", "Enter"], desc: "Insert new line in prompt" },
  { keys: ["Esc"], desc: "Close open modal / popover" },
  { keys: ["Alt", "N"], desc: "Start a new conversation" },
];

export const HelpPage: React.FC<HelpPageProps> = ({ onBackToChat, onOpenFeedback }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F9FA] dark:bg-[#131418] text-[#1F1F1F] dark:text-[#E3E3E3]">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-neutral-800 bg-white/80 dark:bg-[#1e1f20]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            title="Back to Chat"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <HelpCircle className="text-[#1A73E8]" size={22} />
              Help & Documentation Center
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Frequently asked questions, prompt tips, and keyboard shortcuts
            </p>
          </div>
        </div>

        <button
          onClick={onOpenFeedback}
          className="px-4 py-1.5 text-xs font-medium bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-700 transition cursor-pointer"
        >
          Send Feedback
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help topics, FAQs, and guides..."
            className="w-full pl-12 pr-4 py-3 text-sm bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:border-[#1A73E8] shadow-2xs"
          />
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-neutral-300">
            Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-2xs transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-xs sm:text-sm text-[#1F1F1F] dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-850 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-gray-600 dark:text-neutral-300 leading-relaxed border-t border-gray-100 dark:border-neutral-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-white dark:bg-[#1e1f20] p-6 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-white flex items-center gap-2">
            <Keyboard size={16} className="text-[#1A73E8]" />
            Keyboard Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHORTCUTS.map((sc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200/60 dark:border-neutral-800 text-xs"
              >
                <span className="text-gray-600 dark:text-neutral-300">{sc.desc}</span>
                <div className="flex items-center gap-1">
                  {sc.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className="px-2 py-0.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-[11px] font-semibold text-gray-700 dark:text-neutral-300 shadow-2xs"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
