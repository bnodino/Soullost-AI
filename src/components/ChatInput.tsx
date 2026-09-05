import React, { useRef, useState, useEffect } from "react";
import {
  ArrowUp,
  Brain,
  Check,
  ChevronDown,
  Compass,
  Globe,
  Image as ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  Square,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { ImageAttachment, ModelOption, GlobalAdminConfig } from "../types";

interface ChatInputProps {
  onSendMessage: (text: string, images: ImageAttachment[]) => void;
  onStopGenerating?: () => void;
  isGenerating?: boolean;
  useSearch: boolean;
  onToggleSearch: (val: boolean) => void;
  isImageMode: boolean;
  onToggleImageMode: (val: boolean) => void;
  thinkingEnabled: boolean;
  onToggleThinking: (val: boolean) => void;
  imageAspectRatio: string;
  onChangeAspectRatio: (val: string) => void;
  initialText?: string;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  models: ModelOption[];
  isCentered?: boolean;
  globalConfig?: GlobalAdminConfig;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGenerating,
  isGenerating = false,
  useSearch,
  onToggleSearch,
  isImageMode,
  onToggleImageMode,
  thinkingEnabled,
  onToggleThinking,
  imageAspectRatio,
  onChangeAspectRatio,
  initialText = "",
  selectedModel,
  onSelectModel,
  models,
  isCentered = false,
  globalConfig,
}) => {
  const [text, setText] = useState(initialText);
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentModel =
    models.find((m) => m.id === selectedModel) ||
    models.find((m) => m.badge === "Plus") ||
    models[0] || {
      name: "Plus",
      badge: "Plus",
    };

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialText]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [text]);

  // Close menus on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(e.target as Node)
      ) {
        setPlusMenuOpen(false);
      }
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(e.target as Node)
      ) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // Voice dictation using Web Speech API
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported on this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
      };

      recognition.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setIsListening(false);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          if (base64Data) {
            setImages((prev) => [
              ...prev,
              {
                data: base64Data,
                mimeType: file.type,
                name: file.name,
                size: file.size,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Document / Code / Text files (supports up to 25,000,000 letters per question)
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileText = (e.target?.result as string) || "";
          setText((prev) => {
            const combined = prev
              ? `${prev}\n\n[File: ${file.name} - ${fileText.length.toLocaleString()} letters]:\n${fileText}`
              : `[File: ${file.name} - ${fileText.length.toLocaleString()} letters]:\n${fileText}`;
            return combined.slice(0, 25_000_000);
          });
        };
        reader.readAsText(file);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGenerating) {
      onStopGenerating?.();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed && images.length === 0) return;

    onSendMessage(trimmed, images);
    setText("");
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Magic wand prompt enhancer
  const handleEnhancePrompt = async () => {
    if (!text.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch("/api/prompt/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (data.enhanced) {
        setText(data.enhanced);
      }
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div
      className={`w-full transition-all duration-200 ${
        isCentered
          ? "max-w-[760px] mx-auto px-4"
          : "max-w-[760px] mx-auto px-4 sm:px-6 pb-4 pt-1"
      }`}
    >
      {/* Main Pill Container matching image.png */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col bg-white dark:bg-[#1e1f20] border transition-all duration-200 rounded-[28px] ${
          dragActive
            ? "border-[#1A73E8] ring-2 ring-[#1A73E8]/30 shadow-md"
            : "border-[#E3E3E3] dark:border-neutral-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] focus-within:border-gray-400 dark:focus-within:border-neutral-500 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        }`}
      >
        {/* Thumbnail Previews if files attached */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 w-14 h-14 bg-neutral-100 dark:bg-neutral-800 shadow-2xs"
              >
                <img
                  src={img.data}
                  alt={img.name || "Upload"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Active Mode Pills (e.g. Image Studio, Web Search, Think) */}
        {(useSearch || thinkingEnabled || isImageMode) && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
            {useSearch && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-950/60 dark:text-[#8AB4F8] px-2.5 py-0.5 rounded-full">
                <Globe size={11} /> Search Grounding
                <button
                  onClick={() => onToggleSearch(false)}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            )}
            {thinkingEnabled && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#A4C639]/20 text-[#5f7d0e] dark:text-[#A4C639] px-2.5 py-0.5 rounded-full">
                <Brain size={11} /> Deep Thinking
                <button
                  onClick={() => onToggleThinking(false)}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            )}
            {isImageMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 px-2.5 py-0.5 rounded-full">
                <ImageIcon size={11} /> Image Studio ({imageAspectRatio})
                <button
                  onClick={() => onToggleImageMode(false)}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Row with + button, Textarea, and Right controls */}
        <div className="flex items-center gap-1 px-3 py-1.5 min-h-[52px]">
          {/* Left: Plus Button (with popup menu) */}
          <div className="relative shrink-0" ref={plusMenuRef}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.txt,.md,.json,.csv,.py,.js,.ts,.tsx,.jsx,.html,.css,.log"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              id="chat-plus-btn"
              type="button"
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="Add files & features"
              aria-label="Add files"
            >
              <Plus size={19} />
            </button>

            {/* Plus Flyout Menu */}
            {plusMenuOpen && (
              <div className="absolute left-0 bottom-11 w-52 bg-white dark:bg-[#1e1f20] rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-700 p-1.5 z-50 animate-in fade-in zoom-in-95 text-xs text-[#1F1F1F] dark:text-neutral-200">
                {globalConfig?.showAttachButton !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setPlusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <Paperclip size={15} className="text-gray-500" />
                    <span>Attach photos & files</span>
                  </button>
                )}

                {globalConfig?.showWebSearchButton !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSearch(!useSearch);
                      setPlusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <Globe size={15} className={useSearch ? "text-[#1A73E8]" : "text-gray-500"} />
                    <span>Web search {useSearch ? "(On)" : "(Off)"}</span>
                  </button>
                )}

                {globalConfig?.showThinkButton !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleThinking(!thinkingEnabled);
                      setPlusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <Brain size={15} className={thinkingEnabled ? "text-[#81A618]" : "text-gray-500"} />
                    <span>Deep thinking {thinkingEnabled ? "(On)" : "(Off)"}</span>
                  </button>
                )}

                {globalConfig?.showImagesButton !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleImageMode(!isImageMode);
                      setPlusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-left transition cursor-pointer"
                  >
                    <ImageIcon size={15} className={isImageMode ? "text-orange-500" : "text-gray-500"} />
                    <span>Image Studio {isImageMode ? "(Active)" : ""}</span>
                  </button>
                )}

                {isImageMode && globalConfig?.showImagesButton !== false && (
                  <div className="px-3 py-1.5 border-t border-gray-100 dark:border-neutral-800">
                    <span className="text-[10px] font-semibold text-gray-400 block mb-1">
                      Ratio
                    </span>
                    <select
                      value={imageAspectRatio}
                      onChange={(e) => onChangeAspectRatio(e.target.value)}
                      className="w-full text-xs p-1 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 outline-none"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Portrait</option>
                      <option value="4:3">4:3 Standard</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Textarea */}
          <div className="flex-1 min-w-0 px-1 py-1">
            <textarea
              id="soullost-prompt-input"
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isImageMode
                  ? `Describe the image you want ${globalConfig?.appName || "Soul Lost"} to create...`
                  : `Ask ${globalConfig?.appName || "Soul Lost"}`
              }
              className="w-full resize-none bg-transparent outline-none text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-gray-500 text-[15px] sm:text-[16px] leading-relaxed max-h-[180px] py-1"
            />
          </div>

          {/* Right Controls: Model Selector Chip, Voice Mic & Send button */}
          <div className="flex items-center gap-1 shrink-0 pr-1">
            {/* Model Selector Chip - e.g. "Plus ∨", "Pro-Lite ∨", "Pro ∨" */}
            <div className="relative" ref={modelMenuRef}>
              <button
                type="button"
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[#444746] dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                title={`Select ${globalConfig?.appName || "Soul Lost"} Model`}
              >
                <span>{currentModel.badge || currentModel.name}</span>
                <ChevronDown size={13} className="text-gray-500" />
              </button>

              {/* Model Dropdown Menu */}
              {modelMenuOpen && (
                <div className="absolute right-0 bottom-11 w-72 bg-white dark:bg-[#1e1f20] rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-700 p-1.5 z-50 animate-in fade-in zoom-in-95 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    Model
                  </div>
                  <div className="space-y-1">
                    {models
                      .filter((m) => !m.id.includes("image") || isImageMode)
                      .map((m) => {
                        const isSelected = m.id === selectedModel;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onSelectModel(m.id);
                              if (m.id.includes("image")) {
                                onToggleImageMode(true);
                              } else {
                                onToggleImageMode(false);
                              }
                              setModelMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                              isSelected
                                ? "bg-[#E8F0FE] dark:bg-blue-950/60 text-[#1A73E8] dark:text-[#8AB4F8]"
                                : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-[#1F1F1F] dark:text-neutral-200"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 shrink-0">
                                {m.id.includes("image") ? (
                                  <ImageIcon size={16} className="text-orange-500" />
                                ) : m.name === "Pro" || m.id.includes("pro") && !m.id.includes("lite") ? (
                                  <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                                ) : m.name === "Pro-Lite" || m.id.includes("pro-lite") ? (
                                  <Compass size={16} className="text-[#81A618]" />
                                ) : (
                                  <Zap size={16} className="text-[#1A73E8]" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[13px] text-[#1F1F1F] dark:text-white">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-black/5 dark:bg-white/10 text-gray-600 dark:text-neutral-300">
                                    {m.tag || (m.name === "Plus" ? "Fast Answer" : m.name === "Pro-Lite" ? "Medium Research" : "Deep Search")}
                                  </span>
                                </div>
                                <span className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5 leading-snug">
                                  {m.description}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check size={16} className="shrink-0 ml-2 text-[#1A73E8] dark:text-[#8AB4F8]" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Enhance Wand if text exists */}
            {text.trim().length > 8 && globalConfig?.showEnhanceButton !== false && (
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#81A618] hover:bg-[#81A618]/10 transition cursor-pointer"
                title="Enhance prompt with AI"
              >
                {isEnhancing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Wand2 size={15} />
                )}
              </button>
            )}

            {/* Voice Dictation (Microphone) */}
            {globalConfig?.showVoiceButton !== false && (
              <button
                id="voice-dictation-btn"
                type="button"
                onClick={toggleListening}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                title={isListening ? "Stop listening" : "Voice dictation"}
                aria-label="Microphone"
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            )}

            {/* Send or Stop button */}
            {isGenerating ? (
              <button
                id="stop-generating-btn"
                type="button"
                onClick={onStopGenerating}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1F1F1F] dark:bg-neutral-200 text-white dark:text-[#1F1F1F] hover:opacity-90 transition cursor-pointer shrink-0"
                title="Stop generating"
              >
                <Square size={12} className="fill-current" />
              </button>
            ) : (
              (text.trim() || images.length > 0) && (
                <button
                  id="send-message-btn"
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1F1F1F] dark:bg-white text-white dark:text-[#1F1F1F] hover:opacity-90 transition cursor-pointer shrink-0 animate-in fade-in"
                  title="Send message"
                >
                  <ArrowUp size={16} strokeWidth={2.4} />
                </button>
              )
            )}
          </div>
        </div>

        {/* Live letter counter & 25,000,000 max capacity status */}
        {text.length > 0 && (
          <div className="flex items-center justify-between px-4 py-1 border-t border-gray-100 dark:border-neutral-800 text-[11px] text-gray-500 dark:text-neutral-400">
            <span className="font-mono">
              {text.length.toLocaleString()} / 25,000,000 letters
            </span>
            {text.length > 50000 ? (
              <span className="flex items-center gap-1 font-medium text-[#5f7d0e] dark:text-[#A4C639]">
                <span>⚡ 25M High-Capacity Engine Active</span>
              </span>
            ) : (
              <span className="text-gray-500 dark:text-neutral-400">
                Max 25M letters supported
              </span>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-3 text-center text-[11px] text-gray-500 dark:text-neutral-400 select-none flex items-center justify-center gap-2">
        <span>{globalConfig?.appName || "Soul Lost"} can make mistakes, so double-check it.</span>
        <span>•</span>
        <span className="text-gray-500 dark:text-neutral-400 font-medium">Supports up to 25M letters per question</span>
      </div>
    </div>
  );
};
