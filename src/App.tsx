import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ImageModal } from "./components/ImageModal";
import { SettingsModal } from "./components/SettingsModal";
import { AuthModal } from "./components/AuthModal";
import { AdminPanel } from "./components/AdminPanel";
import { UpgradeModal } from "./components/UpgradeModal";
import { ImagesPage } from "./components/pages/ImagesPage";
import { LibraryPage } from "./components/pages/LibraryPage";
import { NotebookPage } from "./components/pages/NotebookPage";
import { ActivityPage } from "./components/pages/ActivityPage";
import { PersonalIntelligencePage } from "./components/pages/PersonalIntelligencePage";
import { UsageLimitsPage } from "./components/pages/UsageLimitsPage";
import { PublicLinksPage } from "./components/pages/PublicLinksPage";
import { HelpPage } from "./components/pages/HelpPage";
import { ImportMemoryModal } from "./components/pages/ImportMemoryModal";
import { FeedbackModal } from "./components/pages/FeedbackModal";
import { LocationModal } from "./components/pages/LocationModal";
import { SearchChatsModal } from "./components/pages/SearchChatsModal";
import { AppSettings, ChatSession, ImageAttachment, Message, ModelOption, UserProfile, GlobalAdminConfig } from "./types";
import { subscribeToAuthChanges, subscribeToGlobalConfig, signOutUser, DEFAULT_GLOBAL_CONFIG, SUPER_ADMIN_EMAIL } from "./lib/firebase";

const DEFAULT_MODELS: ModelOption[] = [
  { id: "fruitfly-plus", name: "Plus", tag: "Fast Answer", description: "Fast Answer — Quick and instant responses for everyday tasks.", badge: "Plus", supportsThinking: false, supportsSearch: true, supportsVision: true },
  { id: "fruitfly-pro-lite", name: "Pro-Lite", tag: "Medium Research", description: "Medium Research — In-depth search with balanced reasoning.", badge: "Pro-Lite", supportsThinking: true, supportsSearch: true, supportsVision: true },
  { id: "fruitfly-pro", name: "Pro", tag: "Deep Search", description: "Deep Search — Advanced multi-step thinking and exhaustive investigation.", badge: "Pro", supportsThinking: true, supportsSearch: true, supportsVision: true },
  { id: "fruitfly-image-studio", name: "Soul Lost Image Studio", tag: "Image Creation", description: "Generates high quality images directly from text prompts.", badge: "Image Studio", supportsThinking: false, supportsSearch: false, supportsVision: false },
];

const DEFAULT_SETTINGS: AppSettings = {
  systemInstruction: "You are Soul Lost, an advanced multimodal AI assistant created by Soul Lost AI. CRITICAL RULE: You are Soul Lost AI. You MUST NEVER identify as or mention Gemini. If asked who you are or who made you, identify yourself as Soul Lost AI. You have high intellect, clear communication, and a creative sparkle. You provide well-structured Markdown answers, accurate code with syntax highlighting, and helpful explanations.",
  theme: "light", thinkingLevel: "LOW", voice: "Kore", autoSpeak: false, imageModel: "flux", imageEnhance: true,
};

const STORAGE_KEY_SESSIONS = "soullost_sessions_v1";
const STORAGE_KEY_SETTINGS = "soullost_settings_v1";

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_SETTINGS) || localStorage.getItem("fruitfly_settings_v1"); return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; }
  });
  const [globalConfig, setGlobalConfig] = useState<GlobalAdminConfig>(DEFAULT_GLOBAL_CONFIG);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges((user) => setCurrentUser(user));
    const unsubConfig = subscribeToGlobalConfig((config) => { setGlobalConfig(config); if (config.appName) document.title = `${config.appName} - Next-Gen AI`; });
    return () => { unsubAuth(); unsubConfig(); };
  }, []);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS) || localStorage.getItem("fruitfly_sessions_v1");
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
    } catch (e) { console.error("Failed to load sessions", e); }
    const now = Date.now(); return [{ id: "session-" + now, title: "New conversation", messages: [], createdAt: now, updatedAt: now }];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessions[0]?.id || "session-1");
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [selectedModel, setSelectedModel] = useState("fruitfly-plus");
  const [useSearch, setUseSearch] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalImage, setModalImage] = useState<{ url: string; prompt?: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [inputPrefill, setInputPrefill] = useState("");
  const [activePage, setActivePage] = useState("chat");
  const [searchChatsModalOpen, setSearchChatsModalOpen] = useState(false);
  const [importMemoryModalOpen, setImportMemoryModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState("Batiaghata, Bangladesh");
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const isDark = settings.theme === "dark"; document.documentElement.classList.toggle("dark", isDark); document.body.classList.toggle("dark", isDark); document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light"); }, [settings.theme]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions)); } catch (e) { console.error("Failed to save sessions", e); } }, [sessions]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings)); } catch (e) { console.error("Failed to save settings", e); } }, [settings]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, messages[messages.length - 1]?.text]);

  const handleNewChat = () => { setActivePage("chat"); const now = Date.now(); const s: ChatSession = { id: "session-" + now, title: "New conversation", messages: [], createdAt: now, updatedAt: now }; setSessions((p) => [s, ...p]); setCurrentSessionId(s.id); setIsImageMode(false); };
  const handleDeleteSession = (id: string) => { setSessions((prev) => { const filtered = prev.filter((s) => s.id !== id); if (!filtered.length) { const now = Date.now(); const fresh = { id: "session-" + now, title: "New conversation", messages: [], createdAt: now, updatedAt: now }; setCurrentSessionId(fresh.id); return [fresh]; } if (currentSessionId === id) setCurrentSessionId(filtered[0].id); return filtered; }); };
  const handleRenameSession = (id: string, title: string) => setSessions((p) => p.map((s) => s.id === id ? { ...s, title } : s));
  const handleTogglePinSession = (id: string) => setSessions((p) => p.map((s) => s.id === id ? { ...s, pinned: !s.pinned } : s));
  const handleClearAll = () => { if (!window.confirm("Are you sure you want to clear all chat history?")) return; const now = Date.now(); const fresh = { id: "session-" + now, title: "New conversation", messages: [], createdAt: now, updatedAt: now }; setSessions([fresh]); setCurrentSessionId(fresh.id); };
  const handleFeedback = (messageId: string, type: "like" | "dislike") => setSessions((p) => p.map((s) => s.id !== currentSessionId ? s : { ...s, messages: s.messages.map((m) => m.id === messageId ? { ...m, feedback: m.feedback === type ? undefined : type } : m) }));
  const handleStopGenerating = () => { abortControllerRef.current?.abort(); abortControllerRef.current = null; setIsGenerating(false); };
  const handleOpenAuth = (mode: "login" | "register" = "login") => { setAuthModalMode(mode); setAuthModalOpen(true); };
  const handleSignOut = async () => { await signOutUser(); };

  const handleSendMessage = async (userText: string, attachedImages: ImageAttachment[]) => {
    if ((!userText.trim() && attachedImages.length === 0) || isGenerating) return;
    const isAdmin = currentUser?.role === "admin" || currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (globalConfig.maintenanceMode && !isAdmin) { alert(globalConfig.maintenanceMessage || "System is under maintenance. Please try again soon."); return; }
    const userMessage: Message = { id: "msg-" + Date.now(), role: "user", text: userText, images: attachedImages.length ? attachedImages : undefined, timestamp: Date.now() };
    const shouldRename = messages.length === 0;
    const sessionTitle = shouldRename ? userText.slice(0, 32) || (attachedImages.length ? "Image analysis" : "New Chat") : currentSession.title;
    const modelMessageId = "msg-" + (Date.now() + 1);
    const modelMessage: Message = { id: modelMessageId, role: "model", text: "", isGenerating: true, timestamp: Date.now(), modelUsed: isImageMode ? "Soul Lost Image Studio" : DEFAULT_MODELS.find((m) => m.id === selectedModel)?.name || globalConfig?.appName || "Soul Lost" };
    setSessions((prev) => prev.map((s) => s.id !== currentSessionId ? s : { ...s, title: sessionTitle, updatedAt: Date.now(), messages: [...s.messages, userMessage, modelMessage] }));
    setIsGenerating(true); abortControllerRef.current = new AbortController();

    if (isImageMode || selectedModel.includes("image")) {
      try {
        const response = await fetch("/api/image/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: userText, aspectRatio: imageAspectRatio, model: settings.imageModel || "flux", enhance: settings.imageEnhance !== false }), signal: abortControllerRef.current.signal });
        const data = await response.json(); if (!response.ok || data.error) throw new Error(data.error || "Failed to generate image.");
        setSessions((prev) => prev.map((s) => s.id !== currentSessionId ? s : { ...s, messages: s.messages.map((m) => m.id !== modelMessageId ? m : { ...m, text: data.text || "Here is your generated image:", generatedImage: { imageUrl: data.imageUrl, prompt: data.prompt || userText, aspectRatio: data.aspectRatio || imageAspectRatio }, isGenerating: false }) }));
      } catch (err: any) { if (err.name !== "AbortError") setSessions((prev) => prev.map((s) => s.id !== currentSessionId ? s : { ...s, messages: s.messages.map((m) => m.id !== modelMessageId ? m : { ...m, isGenerating: false, error: err.message || "Failed to generate image." }) })); } finally { setIsGenerating(false); }
      return;
    }

    try {
      const historyPayload = [...messages.map((m) => ({ role: m.role, text: m.text, images: m.images?.map((img) => ({ data: img.data, mimeType: img.mimeType })) })), { role: "user", text: userText, images: attachedImages.map((img) => ({ data: img.data, mimeType: img.mimeType })) }];
      const response = await fetch("/api/chat/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: historyPayload, model: selectedModel, systemInstruction: globalConfig.systemInstruction || settings.systemInstruction, useSearch, thinkingLevel: thinkingEnabled ? "HIGH" : settings.thinkingLevel }), signal: abortControllerRef.current.signal });
      if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error || `Server responded with status ${response.status}`); }
      const reader = response.body?.getReader(); if (!reader) throw new Error("Unable to read stream response.");
      const decoder = new TextDecoder(); let buffer = ""; let accumulatedText = ""; let accumulatedGrounding: any = null;
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n\n"); buffer = lines.pop() || ""; for (const line of lines) { if (!line.startsWith("data: ")) continue; try { const data = JSON.parse(line.slice(6)); if (data.type === "chunk" && data.text) { accumulatedText += data.text; setSessions((prev) => prev.map((s) => s.id !== currentSessionId ? s : { ...s, messages: s.messages.map((m) => m.id === modelMessageId ? { ...m, text: accumulatedText } : m) })); } else if (data.type === "grounding" && data.grounding) accumulatedGrounding = data.grounding; else if (data.type === "error") throw new Error(data.error); } catch (parseErr) { console.warn("Parse chunk error:", parseErr); } } }
      setSessions((prev) => prev.map((s) => s.id !== currentSessionId ? s : { ...s, messages: s.messages.map((m) => m.id === modelMessageId ? { ...m, text: accumulatedText || "Soul Lost finished.", grounding: accumulatedGrounding, isGenerating: false } : m) }));
    } catch (err: any) { if (err.name !== "AbortError") setSessions((prev) => prev.map((s) => s.id !== currentSessionId ? s : { ...s, messages: s.messages.map((m) => m.id !== modelMessageId ? m : { ...m, isGenerating: false, error: err.message || "Failed to communicate with Soul Lost AI." }) })); } finally { setIsGenerating(false); }
  };

  const handleRegenerate = () => { if (messages.length < 2) return; const idx = [...messages].reverse().findIndex((m) => m.role === "user"); if (idx < 0) return; const actual = messages.length - 1 - idx; const m = messages[actual]; setSessions((p) => p.map((s) => s.id !== currentSessionId ? s : { ...s, messages: s.messages.slice(0, actual + 1) })); handleSendMessage(m.text, m.images || []); };
  const handleSelectPrompt = (prompt: string, isImage = false, wantSearch = false) => { if (isImage) { setIsImageMode(true); setSelectedModel("fruitfly-image-studio"); } if (wantSearch) setUseSearch(true); handleSendMessage(prompt, []); };

  return <div className={`flex h-screen w-screen overflow-hidden ${settings.theme === "dark" ? "dark bg-[#131418] text-[#E3E3E3]" : "bg-[#F8F9FA] text-[#1F1F1F]"} font-sans transition-colors duration-200`}>
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} sessions={sessions} currentSessionId={currentSessionId} onSelectSession={(id) => { setCurrentSessionId(id); setActivePage("chat"); }} onNewChat={handleNewChat} onDeleteSession={handleDeleteSession} onRenameSession={handleRenameSession} onTogglePinSession={handleTogglePinSession} onClearAll={handleClearAll} onOpenSettings={() => setSettingsOpen(true)} currentUser={currentUser} onOpenAuth={handleOpenAuth} onOpenAdmin={() => setAdminPanelOpen(true)} onSignOut={handleSignOut} globalConfig={globalConfig} theme={settings.theme} onSetTheme={(t) => setSettings((s) => ({ ...s, theme: t }))} onToggleImageMode={() => { const next = !isImageMode; setIsImageMode(next); setSelectedModel(next ? "fruitfly-image-studio" : "fruitfly-plus"); }} onOpenUpgrade={() => setUpgradeModalOpen(true)} activePage={activePage} onNavigate={setActivePage} onOpenSearchChats={() => setSearchChatsModalOpen(true)} onOpenImportMemory={() => setImportMemoryModalOpen(true)} onOpenFeedback={() => setFeedbackModalOpen(true)} onOpenLocationModal={() => setLocationModalOpen(true)} userLocation={userLocation} />
    {activePage === "images" ? <ImagesPage onBackToChat={() => setActivePage("chat")} onUsePromptInChat={(prompt) => { setActivePage("chat"); setIsImageMode(true); setSelectedModel("fruitfly-image-studio"); handleSendMessage(prompt, []); }} onOpenLightbox={(info) => setModalImage(info)} /> : activePage === "library" ? <LibraryPage onBackToChat={() => setActivePage("chat")} sessions={sessions} onSelectSession={(id) => { setCurrentSessionId(id); setActivePage("chat"); }} onDeleteSession={handleDeleteSession} onTogglePinSession={handleTogglePinSession} onUsePromptInChat={(prompt) => { setActivePage("chat"); handleSendMessage(prompt, []); }} /> : activePage === "notebook" ? <NotebookPage onBackToChat={() => setActivePage("chat")} /> : activePage === "activity" ? <ActivityPage onBackToChat={() => setActivePage("chat")} sessions={sessions} onSelectSession={(id) => { setCurrentSessionId(id); setActivePage("chat"); }} onClearActivity={handleClearAll} /> : activePage === "personal-intelligence" ? <PersonalIntelligencePage onBackToChat={() => setActivePage("chat")} onOpenImportMemory={() => setImportMemoryModalOpen(true)} /> : activePage === "usage-limits" ? <UsageLimitsPage onBackToChat={() => setActivePage("chat")} onOpenUpgrade={() => setUpgradeModalOpen(true)} /> : activePage === "public-links" ? <PublicLinksPage sessions={sessions} onBackToChat={() => setActivePage("chat")} onSelectSession={(id) => { setCurrentSessionId(id); setActivePage("chat"); }} /> : activePage === "help" ? <HelpPage onBackToChat={() => setActivePage("chat")} onOpenFeedback={() => setFeedbackModalOpen(true)} /> : <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-white dark:bg-[#131418]">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNewChat={handleNewChat} selectedModel={selectedModel} onSelectModel={(id) => { setSelectedModel(id); setIsImageMode(id.includes("image")); }} models={DEFAULT_MODELS} useSearch={useSearch} theme={settings.theme} onToggleTheme={() => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }))} onOpenSettings={() => setSettingsOpen(true)} currentUser={currentUser} onOpenAuth={handleOpenAuth} onOpenAdmin={() => setAdminPanelOpen(true)} onSignOut={handleSignOut} globalConfig={globalConfig} onOpenUpgrade={() => setUpgradeModalOpen(true)} />
      <main className="flex-1 overflow-y-auto flex flex-col">{messages.length === 0 ? <WelcomeScreen globalConfig={globalConfig}><ChatInput onSendMessage={handleSendMessage} onStopGenerating={handleStopGenerating} isGenerating={isGenerating} useSearch={useSearch} onToggleSearch={setUseSearch} isImageMode={isImageMode} onToggleImageMode={(v) => { setIsImageMode(v); setSelectedModel(v ? "fruitfly-image-studio" : "fruitfly-plus"); }} thinkingEnabled={thinkingEnabled} onToggleThinking={setThinkingEnabled} imageAspectRatio={imageAspectRatio} onChangeAspectRatio={setImageAspectRatio} initialText={inputPrefill} selectedModel={selectedModel} onSelectModel={(id) => { setSelectedModel(id); setIsImageMode(id.includes("image")); }} models={DEFAULT_MODELS} isCentered={true} globalConfig={globalConfig} /></WelcomeScreen> : <div className="flex-1 pb-4">{messages.map((msg, idx) => <ChatMessage key={msg.id || idx} message={msg} onRegenerate={idx === messages.length - 1 && msg.role === "model" ? handleRegenerate : undefined} onEditPrompt={setInputPrefill} onImageClick={(url, prompt) => setModalImage({ url, prompt })} onFeedback={handleFeedback} />)}<div ref={messagesEndRef} /></div>}</main>
      {messages.length > 0 && <footer className="sticky bottom-0 z-20 bg-gradient-to-t from-white via-white/95 dark:from-[#131418] dark:via-[#131418]/95 to-transparent pt-2"><ChatInput onSendMessage={handleSendMessage} onStopGenerating={handleStopGenerating} isGenerating={isGenerating} useSearch={useSearch} onToggleSearch={setUseSearch} isImageMode={isImageMode} onToggleImageMode={(v) => { setIsImageMode(v); setSelectedModel(v ? "fruitfly-image-studio" : "fruitfly-plus"); }} thinkingEnabled={thinkingEnabled} onToggleThinking={setThinkingEnabled} imageAspectRatio={imageAspectRatio} onChangeAspectRatio={setImageAspectRatio} initialText={inputPrefill} selectedModel={selectedModel} onSelectModel={(id) => { setSelectedModel(id); setIsImageMode(id.includes("image")); }} models={DEFAULT_MODELS} isCentered={false} globalConfig={globalConfig} /></footer>}
    </div>}
    <ImageModal imageUrl={modalImage?.url || null} prompt={modalImage?.prompt} onClose={() => setModalImage(null)} />
    <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onUpdateSettings={(v) => setSettings((p) => ({ ...p, ...v }))} onResetSettings={() => setSettings(DEFAULT_SETTINGS)} />
    <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authModalMode} requireCaptcha={false} />
    <AdminPanel isOpen={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} currentUserProfile={currentUser} globalConfig={globalConfig} onConfigUpdated={setGlobalConfig} />
    <SearchChatsModal isOpen={searchChatsModalOpen} onClose={() => setSearchChatsModalOpen(false)} sessions={sessions} onSelectSession={(id) => { setCurrentSessionId(id); setActivePage("chat"); setSearchChatsModalOpen(false); }} />
    <ImportMemoryModal isOpen={importMemoryModalOpen} onClose={() => setImportMemoryModalOpen(false)} />
    <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    <LocationModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} currentLocation={userLocation} onSelectLocation={setUserLocation} />
  </div>;
}
