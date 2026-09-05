export interface ImageAttachment {
  data: string; // base64 data url or base64 string
  mimeType: string;
  name?: string;
  size?: number;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  searchChunks?: GroundingSource[];
}

export interface GeneratedImageInfo {
  imageUrl: string;
  prompt: string;
  aspectRatio: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  images?: ImageAttachment[];
  isGenerating?: boolean;
  error?: string;
  grounding?: GroundingMetadata;
  generatedImage?: GeneratedImageInfo;
  timestamp: number;
  modelUsed?: string;
  feedback?: "like" | "dislike";
  thoughtProcess?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  badge: string;
  supportsThinking: boolean;
  supportsSearch: boolean;
  supportsVision: boolean;
}

export interface AppSettings {
  systemInstruction: string;
  theme: "dark" | "light";
  thinkingLevel: "HIGH" | "LOW" | "MINIMAL" | "OFF";
  voice: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";
  autoSpeak: boolean;
  imageModel?: "flux" | "turbo";
  imageEnhance?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  currency: string;
  badge?: string;
  description: string;
  features: string[];
  modelAccess: string[];
  maxLettersPerQuestion: number;
  isPopular?: boolean;
  isActive: boolean;
  color?: string;
  createdAt: string;
}

export interface AppVersion {
  id: string;
  versionNumber: string;
  releaseDate: string;
  title: string;
  changelog: string[];
  status: "active" | "beta" | "deprecated" | "planned";
  recommendedModel: string;
  minSupportedClient?: string;
  isCurrent?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "user";
  status: "active" | "suspended" | "banned";
  createdAt: string;
  lastLoginAt: string;
  totalMessages: number;
  tokensUsed: number;
  subscriptionTier?: string; // plan ID or 'free' | 'plus' | 'pro' | 'enterprise'
  subscriptionStatus?: "active" | "trial" | "expired" | "cancelled" | "lifetime";
  subscriptionExpiresAt?: string;
  customQuotaLetters?: number;
}

export interface CustomStarterPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  isImage?: boolean;
  useSearch?: boolean;
}

export interface GlobalAdminConfig {
  appName: string;
  tagline: string;
  logoAccentColor: string;
  customLogoUrl?: string;
  welcomeHeadline: string;
  welcomeSubtitle: string;
  defaultModel: string;
  defaultThinkingLevel: "HIGH" | "LOW" | "MINIMAL" | "OFF";
  systemInstruction: string;
  temperature: number;
  maxOutputTokens: number;
  enableGoogleSearch: boolean;
  enableImageGen: boolean;
  enableThinking: boolean;
  enableVoice: boolean;
  requireCaptchaLogin: boolean;
  requireCaptchaRegister: boolean;
  requireCaptchaPrompts: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementActive: boolean;
  announcementText: string;
  announcementType: "info" | "warning" | "success" | "critical";
  allowGuestAccess: boolean;
  starterPrompts: CustomStarterPrompt[];
  // Button & Module Visibility Manager (Configurable via Admin Panel)
  showImagesButton?: boolean;
  showNotebookButton?: boolean;
  showWebSearchButton?: boolean;
  showThinkButton?: boolean;
  showVoiceButton?: boolean;
  showUploadButton?: boolean;
  showAttachButton?: boolean;
  showMemoryButton?: boolean;
  showUpgradeButton?: boolean;
  showShareButton?: boolean;
  showClearAllButton?: boolean;
  showLibraryButton?: boolean;
  showSearchChatsButton?: boolean;
  showNewChatButton?: boolean;
  showDeleteChatButton?: boolean;
  showThemeButton?: boolean;
  showModelSelector?: boolean;
  showEnhanceButton?: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actorEmail: string;
  target: string;
  timestamp: string;
  details: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  maskedKey: string;
  status: "active" | "quota_exhausted" | "invalid" | "disabled";
  isEnvDefault?: boolean;
  requestsHandled: number;
  lastUsedAt?: string;
  lastError?: string;
  lastCheckedAt?: string;
  latencyMs?: number;
  createdAt: string;
  notes?: string;
}

export interface ApiKeySummary {
  total: number;
  active: number;
  quotaExhausted: number;
  invalid: number;
  disabled: number;
  totalRequests: number;
}

export interface ApiKeyTestResult {
  valid: boolean;
  status: "active" | "quota_exhausted" | "invalid" | "error";
  message: string;
  latencyMs: number;
  model?: string;
}
