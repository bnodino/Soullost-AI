import React, { useState } from "react";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
  ArrowLeft,
  Copy,
  Check,
  Zap,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { GeneratedImageInfo } from "../../types";

interface ImagesPageProps {
  onBackToChat: () => void;
  onUsePromptInChat: (prompt: string) => void;
  onOpenLightbox: (info: { url: string; prompt?: string }) => void;
}

interface ImageHistoryItem {
  id: string;
  url: string;
  prompt: string;
  ratio: string;
  style: string;
  model: string;
  timestamp: number;
}

const STYLE_OPTIONS = [
  { label: "No extra style", value: "", suffix: "" },
  {
    label: "Photorealistic",
    value: ", photorealistic, highly detailed, 8k resolution, professional photography",
    suffix: "photorealistic",
  },
  {
    label: "Digital Art",
    value: ", digital painting, vibrant colors, detailed illustration, concept art",
    suffix: "digital art",
  },
  {
    label: "Anime",
    value: ", anime style, high quality Japanese animation art, studio anime aesthetic",
    suffix: "anime",
  },
  {
    label: "3D Render",
    value: ", 3d render, octane render, ray tracing, unreal engine 5, photorealistic volumetric lighting",
    suffix: "3d render",
  },
  {
    label: "Cinematic",
    value: ", cinematic lighting, dramatic atmosphere, 35mm film still, depth of field",
    suffix: "cinematic",
  },
  {
    label: "Cyberpunk",
    value: ", cyberpunk neon style, futuristic sci-fi city, glowing holographic lights, rain reflections",
    suffix: "cyberpunk",
  },
];

const RATIO_OPTIONS = [
  { label: "Square 1:1", value: "1024x1024", aspect: "1:1" },
  { label: "Landscape 16:9", value: "1280x720", aspect: "16:9" },
  { label: "Portrait 9:16", value: "720x1280", aspect: "9:16" },
  { label: "Wide 4:3", value: "1024x768", aspect: "4:3" },
  { label: "Tall 3:4", value: "768x1024", aspect: "3:4" },
];

const CHIP_PROMPTS = [
  { label: "🦁 Lion", prompt: "a majestic lion, cinematic lighting, ultra realistic 8k" },
  { label: "🏙️ City", prompt: "futuristic city at sunset, flying cars, neon reflections" },
  { label: "🍎 Fruit", prompt: "a bowl of fresh fruit on a rustic table in natural sunlight" },
  { label: "🌲 Forest", prompt: "a magical forest with glowing bioluminescent lights, fantasy mist" },
  { label: "🚀 Astronaut", prompt: "an astronaut floating in deep cosmos, nebula reflection in helmet visor" },
  { label: "🐱 Cyber Cat", prompt: "cyberpunk glowing robotic cat with blue visor, neon alley in rain" },
];

export const ImagesPage: React.FC<ImagesPageProps> = ({
  onBackToChat,
  onUsePromptInChat,
  onOpenLightbox,
}) => {
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1024x1024");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [enhance, setEnhance] = useState(true);
  const [model, setModel] = useState<"flux" | "turbo">("flux");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error" | "">("");
  const [currentResult, setCurrentResult] = useState<ImageHistoryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingBlob, setSavingBlob] = useState(false);

  // History loaded from localStorage
  const [history, setHistory] = useState<ImageHistoryItem[]>(() => {
    try {
      const saved =
        localStorage.getItem("soullost_image_studio_history_v2") ||
        localStorage.getItem("fruitfly_image_studio_history_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const saveHistory = (newHistory: ImageHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("soullost_image_studio_history_v2", JSON.stringify(newHistory));
    } catch (e) {
      console.error(e);
    }
  };

  // Build the image URL based on user input (No API key needed, using Pollinations Flux)
  const buildImageUrl = (customPrompt?: string, customSeed?: number) => {
    const rawText = (customPrompt || prompt).trim() || "a beautiful landscape";
    const textWithStyle = selectedStyle ? `${rawText}${selectedStyle}` : rawText;
    const [w, h] = selectedRatio.split("x");
    const seed = customSeed !== undefined ? customSeed : Math.floor(Math.random() * 10000000);

    return {
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(textWithStyle)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=${model}&enhance=${enhance ? "true" : "false"}`,
      fullPrompt: textWithStyle,
      seed,
    };
  };

  // Generate Image Handler
  const handleGenerate = (customPromptText?: string) => {
    const promptToUse = customPromptText || prompt;
    if (!promptToUse.trim() && !prompt.trim()) {
      setStatusMessage("অনুগ্রহ করে একটি prompt লিখুন (Please enter a prompt).");
      setStatusType("error");
      return;
    }

    setIsGenerating(true);
    setStatusMessage("Image তৈরি হচ্ছে... সম্পূর্ণ তৈরি না হওয়া পর্যন্ত অপেক্ষা করুন। (Generating artwork...)");
    setStatusType("info");

    const { url, fullPrompt } = buildImageUrl(promptToUse);

    // Preload image
    const img = new Image();
    img.onload = () => {
      const newItem: ImageHistoryItem = {
        id: "img-" + Date.now(),
        url,
        prompt: fullPrompt,
        ratio: selectedRatio,
        style: selectedStyle,
        model,
        timestamp: Date.now(),
      };

      setCurrentResult(newItem);
      const updated = [newItem, ...history.filter((h) => h.url !== url)].slice(0, 24);
      saveHistory(updated);

      setIsGenerating(false);
      setStatusMessage("✅ তৈরি হয়েছে! (Successfully generated)");
      setStatusType("success");
    };

    img.onerror = () => {
      // Fallback: still show the result so user can view/retry
      const fallbackItem: ImageHistoryItem = {
        id: "img-" + Date.now(),
        url,
        prompt: fullPrompt,
        ratio: selectedRatio,
        style: selectedStyle,
        model,
        timestamp: Date.now(),
      };
      setCurrentResult(fallbackItem);
      setIsGenerating(false);
      setStatusMessage("⚠️ সরাসরি লোড হতে একটু সময় নিচ্ছে, নিচের ছবিতে ক্লিক করে দেখতে পারেন।");
      setStatusType("info");
    };

    img.src = url;
  };

  // Download Image with CORS & proxy fallback
  const handleDownload = async (imageUrl: string, promptText: string) => {
    if (!imageUrl) return;
    setSavingBlob(true);
    setStatusMessage("⬇️ Save হচ্ছে... (Downloading image)");
    setStatusType("info");

    try {
      // 1. Try direct fetch with CORS
      let blob: Blob | null = null;
      try {
        const res = await fetch(imageUrl, { mode: "cors" });
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (err) {
        console.warn("Direct CORS fetch failed, trying proxy...", err);
      }

      // 2. If direct fetch fails, fetch through backend proxy
      if (!blob) {
        const proxyRes = await fetch(`/api/image/proxy?url=${encodeURIComponent(imageUrl)}`);
        if (proxyRes.ok) {
          blob = await proxyRes.blob();
        }
      }

      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        const filename = `soullost-${(promptText || "image").slice(0, 25).replace(/[^a-z0-9]/gi, "_")}.jpg`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        setStatusMessage("✅ Save হয়ে গেছে! (Image saved)");
        setStatusType("success");
      } else {
        throw new Error("Unable to create image blob");
      }
    } catch (e) {
      console.error("Save error:", e);
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
      setStatusMessage("⚠️ সরাসরি download ব্লক হয়েছে, তাই নতুন ট্যাবে খোলা হয়েছে — সেখান থেকে Save Image করুন।");
      setStatusType("info");
    } finally {
      setSavingBlob(false);
    }
  };

  const handleCopyPrompt = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    if (currentResult?.id === id) {
      setCurrentResult(updated[0] || null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F9FA] dark:bg-[#131418] text-[#1F1F1F] dark:text-[#E3E3E3]">
      {/* Top Header bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-neutral-800 bg-white/90 dark:bg-[#1e1f20]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            title="Back to Chat"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-[#1F1F1F] dark:text-white">
              <ImageIcon className="text-[#A4C639]" size={22} />
              <span>AI Image Generator</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#A4C639]/15 text-[#5f7d0e] dark:text-[#A4C639] border border-[#A4C639]/30">
                FLUX Engine
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Prompt লিখো, AI দিয়ে ছবি বানাও — বিনামূল্যে, কোনো API key লাগবে না।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1 bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-950/60 dark:text-[#8AB4F8] rounded-full">
            {history.length} Saved Images
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Main Generator Card */}
        <div className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 shadow-sm border border-[#E3E3E3] dark:border-neutral-800 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#A4C639]" />
              Image Description (Prompt)
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="যেমন: white spiky hair, blue eyes, black blindfold, tall man, anime style, cinematic lighting..."
              className="w-full rounded-2xl border border-gray-200 dark:border-neutral-700 p-4 bg-gray-50 dark:bg-[#14151a] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-gray-400 focus:outline-none focus:border-[#A4C639] focus:ring-1 focus:ring-[#A4C639] text-sm resize-none"
            />
          </div>

          {/* Tips Box */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#0f1626]/5 dark:bg-[#141d2e] border border-blue-100 dark:border-blue-900/40 text-xs text-gray-600 dark:text-blue-200/80 leading-relaxed">
            <HelpCircle size={17} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <b className="text-gray-800 dark:text-blue-100">ভালো ফলাফলের টিপস (Tips):</b> শুধু নাম (যেমন "Gojo") না লিখে <b>চেহারা বর্ণনা</b> করো — চুলের রঙ, চোখের রঙ, পোশাক, আলো, style। AI রঙ, আকৃতি এবং শৈলী সবচেয়ে নিখুঁতভাবে বোঝে।
            </div>
          </div>

          {/* Controls: Ratio, Style, Model Engine */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Ratio */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                Aspect Ratio
              </label>
              <select
                id="ratio"
                value={selectedRatio}
                onChange={(e) => setSelectedRatio(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#14151a] text-[#1F1F1F] dark:text-white text-xs outline-none focus:border-[#A4C639] cursor-pointer"
              >
                {RATIO_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                Artistic Style
              </label>
              <select
                id="style"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#14151a] text-[#1F1F1F] dark:text-white text-xs outline-none focus:border-[#A4C639] cursor-pointer"
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s.label} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Engine */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                AI Engine
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#14151a] text-[#1F1F1F] dark:text-white text-xs outline-none focus:border-[#A4C639] cursor-pointer"
              >
                <option value="flux">FLUX (Highest Quality & Detail)</option>
                <option value="turbo">Turbo (Ultra Fast Generation)</option>
              </select>
            </div>
          </div>

          {/* Enhance Prompt Checkbox */}
          <label className="flex items-center gap-2 pt-1 text-xs text-gray-700 dark:text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              id="enhance"
              checked={enhance}
              onChange={(e) => setEnhance(e.target.checked)}
              className="w-4 h-4 rounded text-[#A4C639] focus:ring-[#A4C639] border-gray-300 dark:border-neutral-700 cursor-pointer"
            />
            <span>AI দিয়ে prompt আরও ভালো করো (বেশি নির্ভুল ও ডিটেইল্ড ফলাফল)</span>
          </label>

          {/* Quick Prompt Chips */}
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block mb-1.5">
              Quick Inspirations (ক্লিক করে সরাসরি চেষ্টা করো):
            </span>
            <div className="flex flex-wrap gap-2">
              {CHIP_PROMPTS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(chip.prompt);
                    handleGenerate(chip.prompt);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-[#A4C639]/15 hover:text-[#5f7d0e] dark:hover:text-[#A4C639] hover:border-[#A4C639]/40 border border-transparent transition cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <button
              id="genBtn"
              type="button"
              disabled={isGenerating}
              onClick={() => handleGenerate()}
              className="w-full py-3.5 rounded-2xl bg-[#A4C639] hover:bg-[#92b230] text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Image তৈরি হচ্ছে... (Generating Image)</span>
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  <span>✨ Generate Image (বিনামূল্যে ছবি তৈরি করুন)</span>
                </>
              )}
            </button>
          </div>

          {/* Status message */}
          {statusMessage && (
            <div
              id="status"
              className={`text-xs p-3 rounded-xl flex items-center gap-2 ${
                statusType === "error"
                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
                  : statusType === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
              }`}
            >
              {isGenerating && <Loader2 size={14} className="animate-spin" />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Current Result Card */}
        {currentResult && (
          <div
            id="resultCard"
            className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 shadow-sm border border-[#E3E3E3] dark:border-neutral-800 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1F1F1F] dark:text-white flex items-center gap-2">
                <Sparkles size={17} className="text-[#A4C639]" />
                <span>Generated Artwork</span>
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400">
                {currentResult.ratio} • {currentResult.model.toUpperCase()}
              </span>
            </div>

            {/* Output Image */}
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-black/5 dark:bg-black/30 border border-gray-200 dark:border-neutral-800 group cursor-pointer"
              onClick={() => onOpenLightbox({ url: currentResult.url, prompt: currentResult.prompt })}
            >
              <img
                id="output"
                src={currentResult.url}
                alt={currentResult.prompt}
                referrerPolicy="no-referrer"
                className="w-full max-h-[550px] object-contain mx-auto"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 text-white">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLightbox({ url: currentResult.url, prompt: currentResult.prompt });
                  }}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition"
                  title="Fullscreen"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>

            {/* Prompt Display */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#14151a] border border-gray-100 dark:border-neutral-800 text-xs text-gray-700 dark:text-neutral-300 leading-relaxed">
              <b className="text-gray-900 dark:text-white">Prompt: </b>
              {currentResult.prompt}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                id="saveBtn"
                type="button"
                disabled={savingBlob}
                onClick={() => handleDownload(currentResult.url, currentResult.prompt)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {savingBlob ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>⬇️ Save Image (ডাউনলোড করুন)</span>
              </button>

              <button
                id="regenBtn"
                type="button"
                onClick={() => handleGenerate()}
                className="px-4 py-2.5 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>🔄 Try Again (আবার তৈরি করো)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyPrompt(currentResult.prompt, "current-result")}
                className="px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedId === "current-result" ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onUsePromptInChat(currentResult.prompt)}
                className="px-3.5 py-2.5 rounded-full border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[#1A73E8] dark:text-[#8AB4F8] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>💬 Open in Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* Previous Images Strip (History Card) */}
        {history.length > 0 && (
          <div
            id="historyCard"
            className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 shadow-sm border border-[#E3E3E3] dark:border-neutral-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 dark:text-neutral-300 flex items-center gap-2">
                <span>🕘 আগের ছবিগুলো (tap করে আবার দেখো)</span>
              </h3>
              <span className="text-[11px] text-gray-400">
                {history.length} items
              </span>
            </div>

            <div id="history" className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setCurrentResult(item);
                    document.getElementById("resultCard")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 cursor-pointer transition hover:scale-105 ${
                    currentResult?.id === item.id
                      ? "border-[#A4C639] ring-2 ring-[#A4C639]/30"
                      : "border-gray-200 dark:border-neutral-700"
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Gallery Grid Section */}
        {history.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1F1F1F] dark:text-white">
                All Created Images (গ্যালারি)
              </h2>
              <span className="text-xs text-gray-400">
                Saved in your browser
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-[#1e1f20] rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-xs hover:shadow-md transition flex flex-col"
                >
                  <div
                    className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 cursor-pointer"
                    onClick={() => onOpenLightbox({ url: item.url, prompt: item.prompt })}
                  >
                    <img
                      src={item.url}
                      alt={item.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLightbox({ url: item.url, prompt: item.prompt });
                        }}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition"
                        title="View Fullscreen"
                      >
                        <Maximize2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item.url, item.prompt);
                        }}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-gray-700 dark:text-neutral-300 line-clamp-2 leading-relaxed mb-3">
                      {item.prompt}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-800 text-xs">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-500">
                        {item.ratio}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(item.prompt, item.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                          title="Copy prompt"
                        >
                          {copiedId === item.id ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Delete from gallery"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
