import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  ExternalLink,
  Globe,
  ImageIcon,
  Maximize2,
  MoreVertical,
  RotateCcw,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Message } from "../types";
import { FruitflyIcon } from "./FruitflyIcon";
import { CodeBlock } from "./CodeBlock";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onEditPrompt?: (text: string) => void;
  onImageClick?: (imageUrl: string, prompt?: string) => void;
  onFeedback?: (id: string, type: "like" | "dislike") => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onEditPrompt,
  onImageClick,
  onFeedback,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showThought, setShowThought] = useState(false);
  const [showSources, setShowSources] = useState(true);

  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleSpeech = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.text.replace(/[*#`_~[\]]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Soul Lost AI Response",
          text: message.text,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className={`group w-full py-5 px-4 sm:px-6 transition-colors ${
        isUser
          ? "bg-transparent text-[#1F1F1F] dark:text-[#E3E3E3]"
          : "bg-[#F8F9FA]/90 dark:bg-[#16181e]/60 border-y border-[#F0F4F9] dark:border-neutral-800/40"
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 sm:gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[#D3E3FD] text-[#041E49] font-bold text-xs flex items-center justify-center shadow-xs select-none">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A4C639] to-[#81A618] text-white flex items-center justify-center shadow-xs relative">
              <FruitflyIcon size={18} animate={message.isGenerating} />
            </div>
          )}
        </div>

        {/* Message Content Body */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm tracking-tight text-[#1F1F1F] dark:text-neutral-100 flex items-center gap-2">
              {isUser ? "You" : "Soul Lost"}
              {!isUser && message.modelUsed && (
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-[#E9EEF6] dark:bg-neutral-800 text-[#041E49] dark:text-[#D3E3FD]">
                  {message.modelUsed}
                </span>
              )}
            </span>

            {/* Timestamp */}
            <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* User Attached Images */}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {message.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => onImageClick?.(img.data, img.name)}
                  className="relative group/img cursor-pointer rounded-xl overflow-hidden border border-[#E0E0E0] dark:border-neutral-700 max-w-[200px] max-h-[160px] bg-neutral-100 dark:bg-neutral-800 shadow-xs transition hover:scale-[1.02]"
                >
                  <img
                    src={img.data}
                    alt={img.name || `Attachment ${idx + 1}`}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                    <Maximize2 size={16} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Optional Thought Process (Deep Reasoning) */}
          {message.thoughtProcess && (
            <div className="rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 bg-[#F0F4F9] dark:bg-neutral-900/60 overflow-hidden text-xs">
              <button
                onClick={() => setShowThought(!showThought)}
                className="w-full px-3 py-2 flex items-center justify-between text-[#444746] dark:text-neutral-400 hover:text-[#1F1F1F] dark:hover:text-neutral-200 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles size={13} className="text-[#81A618]" />
                  Reasoning Thought Process
                </span>
                {showThought ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showThought && (
                <div className="p-3 border-t border-[#E0E0E0] dark:border-neutral-800 font-mono text-[12px] text-[#444746] dark:text-neutral-300 whitespace-pre-wrap bg-white/70 dark:bg-black/20">
                  {message.thoughtProcess}
                </div>
              )}
            </div>
          )}

          {/* Generated Image Output (if image model) */}
          {message.generatedImage && (
            <div className="my-3 max-w-md rounded-2xl overflow-hidden border border-[#E0E0E0] dark:border-neutral-800 bg-white dark:bg-[#16181d] shadow-xs">
              <div
                className="relative group/genImg cursor-pointer overflow-hidden aspect-square bg-black/20 flex items-center justify-center"
                onClick={() =>
                  onImageClick?.(
                    message.generatedImage!.imageUrl,
                    message.generatedImage!.prompt
                  )
                }
              >
                <img
                  src={message.generatedImage.imageUrl}
                  alt={message.generatedImage.prompt}
                  className="w-full h-full object-cover transition duration-300 group-hover/genImg:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/genImg:opacity-100 flex items-center justify-center transition gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium flex items-center gap-1.5">
                    <Maximize2 size={13} /> View Full
                  </span>
                </div>
              </div>
              <div className="p-3 border-t border-[#E0E0E0] dark:border-neutral-800 text-xs text-[#444746] dark:text-neutral-400 flex items-center justify-between">
                <span className="truncate max-w-[80%] font-medium">
                  "{message.generatedImage.prompt}"
                </span>
                <span className="text-[10px] font-mono uppercase bg-[#E9EEF6] dark:bg-neutral-800 px-2 py-0.5 rounded-full text-[#041E49] dark:text-neutral-300 font-bold">
                  {message.generatedImage.aspectRatio}
                </span>
              </div>
            </div>
          )}

          {/* Error display */}
          {message.error && (
            <div className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs leading-relaxed">
              <strong className="font-semibold block mb-1">Error:</strong>
              {message.error}
            </div>
          )}

          {/* Text Content / Markdown */}
          {message.text && (
            <div className="prose-soullost text-[#1F1F1F] dark:text-[#E3E3E3] text-[15px] leading-relaxed break-words">
              {isUser ? (
                <div className="whitespace-pre-wrap">{message.text}</div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !String(children).includes("\n");
                      if (isInline) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <CodeBlock
                          language={match ? match[1] : "plaintext"}
                          code={String(children).replace(/\n$/, "")}
                        />
                      );
                    },
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Streaming Indicator */}
          {message.isGenerating && (
            <div className="flex items-center gap-2 py-2 text-xs text-[#6e9010] dark:text-[#A4C639] font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#A4C639]"></span>
              Soul Lost is thinking and crafting response...
            </div>
          )}

          {/* Google Search Grounding Sources */}
          {message.grounding?.searchChunks &&
            message.grounding.searchChunks.length > 0 && (
              <div className="pt-2 border-t border-[#E0E0E0] dark:border-neutral-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#444746] dark:text-neutral-400 flex items-center gap-1.5">
                    <Globe size={13} className="text-[#4285F4]" />
                    Search Sources ({message.grounding.searchChunks.length})
                  </span>
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="text-[11px] text-gray-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    {showSources ? "Hide" : "Show"}
                  </button>
                </div>

                {showSources && (
                  <div className="flex flex-wrap gap-2">
                    {message.grounding.searchChunks.map((chunk, idx) => {
                      if (!chunk.web?.uri) return null;
                      let domain = "";
                      try {
                        domain = new URL(chunk.web.uri).hostname.replace("www.", "");
                      } catch {
                        domain = "source";
                      }
                      return (
                        <a
                          key={idx}
                          href={chunk.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E0E0E0] dark:border-neutral-800 bg-white dark:bg-[#1a1c22] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 text-xs text-[#444746] dark:text-neutral-300 transition shadow-xs max-w-xs truncate group/src"
                          title={chunk.web.title || chunk.web.uri}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
                          <span className="truncate font-medium text-[11px]">
                            {chunk.web.title || domain}
                          </span>
                          <ExternalLink
                            size={10}
                            className="text-gray-400 group-hover/src:text-[#4285F4] flex-shrink-0"
                          />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          {/* Action Toolbar for Soul Lost messages */}
          {!isUser && !message.isGenerating && (
            <div className="flex items-center gap-1 pt-1 text-[#444746] dark:text-neutral-400">
              <button
                id={`copy-msg-${message.id}`}
                onClick={handleCopy}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1F1F1F] dark:hover:text-white transition cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check size={15} className="text-[#81A618]" /> : <Copy size={15} />}
              </button>

              <button
                id={`tts-msg-${message.id}`}
                onClick={handleSpeech}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isPlayingAudio
                    ? "bg-[#D3E3FD] text-[#041E49] animate-pulse"
                    : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1F1F1F] dark:hover:text-white"
                }`}
                title={isPlayingAudio ? "Stop reading" : "Read aloud (Listen)"}
              >
                {isPlayingAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {onRegenerate && (
                <button
                  id={`regen-msg-${message.id}`}
                  onClick={onRegenerate}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1F1F1F] dark:hover:text-white transition cursor-pointer"
                  title="Regenerate response"
                >
                  <RotateCcw size={15} />
                </button>
              )}

              <button
                id={`like-msg-${message.id}`}
                onClick={() => onFeedback?.(message.id, "like")}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  message.feedback === "like"
                    ? "text-[#6e9010] bg-[#A4C639]/20"
                    : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1F1F1F] dark:hover:text-white"
                }`}
                title="Good response"
              >
                <ThumbsUp size={15} />
              </button>

              <button
                id={`dislike-msg-${message.id}`}
                onClick={() => onFeedback?.(message.id, "dislike")}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  message.feedback === "dislike"
                    ? "text-red-500 bg-red-500/10"
                    : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1F1F1F] dark:hover:text-white"
                }`}
                title="Bad response"
              >
                <ThumbsDown size={15} />
              </button>

              <button
                id={`share-msg-${message.id}`}
                onClick={handleShare}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1F1F1F] dark:hover:text-white transition ml-auto cursor-pointer"
                title="Share or Export"
              >
                <Share2 size={15} />
              </button>
            </div>
          )}

          {/* User message edit button */}
          {isUser && onEditPrompt && (
            <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[#444746] dark:text-neutral-400">
              <button
                onClick={() => onEditPrompt(message.text)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1F1F1F] dark:hover:text-white transition cursor-pointer"
              >
                <Edit2 size={12} />
                <span>Edit prompt</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
