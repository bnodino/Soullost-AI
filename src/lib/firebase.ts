import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  increment,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import {
  UserProfile,
  GlobalAdminConfig,
  ActivityLog,
  CustomStarterPrompt,
  SubscriptionPlan,
  AppVersion,
} from "../types";
import { optimizeLogoImage } from "./imageOptimizer";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || "(default)"
);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const SUPER_ADMIN_EMAIL = "jibon0757j@gmail.com";

export const DEFAULT_STARTER_PROMPTS: CustomStarterPrompt[] = [
  {
    id: "prompt-1",
    title: "Science & Biology",
    description: "Why is Drosophila melanogaster (fruit fly) the world's most famous genetic research model?",
    prompt: "Explain why the common fruit fly (Drosophila melanogaster) is so crucial to genetic and biological research.",
    icon: "Sparkles",
    isImage: false,
    useSearch: false,
  },
  {
    id: "prompt-2",
    title: "Coding & Architecture",
    description: "Write a high-performance Python FastAPI service with rate limiting and async workers.",
    prompt: "Show me a clean, production-ready Python FastAPI architecture with asynchronous background task processing and token-bucket rate limiting.",
    icon: "Code",
    isImage: false,
    useSearch: false,
  },
  {
    id: "prompt-3",
    title: "Real-time Knowledge",
    description: "What are the biggest recent breakthroughs in artificial intelligence and quantum computing?",
    prompt: "What are the most significant recent breakthroughs in AI and quantum computing this month?",
    icon: "Globe",
    isImage: false,
    useSearch: true,
  },
  {
    id: "prompt-4",
    title: "Soul Lost Image Studio",
    description: "Generate a futuristic laboratory terrarium with bioluminescent flora in high fidelity.",
    prompt: "A photorealistic futuristic botanist laboratory containing a glowing geometric terrarium with bioluminescent plants and micro-drones, cinematic warm lighting, 8k render",
    icon: "ImageIcon",
    isImage: true,
    useSearch: false,
  },
];

export const DEFAULT_GLOBAL_CONFIG: GlobalAdminConfig = {
  appName: "Soul Lost",
  tagline: "High-intellect multimodal AI assistant",
  logoAccentColor: "#A4C639",
  customLogoUrl: "",
  welcomeHeadline: "Soul Lost",
  welcomeSubtitle: "How can Soul Lost help you grow and explore today?",
  defaultModel: "fruitfly-plus",
  defaultThinkingLevel: "LOW",
  systemInstruction:
    "You are Soul Lost, an intelligent, advanced multimodal AI assistant created by Soul Lost AI. " +
    "CRITICAL RULE: You are Soul Lost AI. You MUST NEVER mention or describe yourself as Gemini. If asked who created you or what model you are, always state that you are Soul Lost AI. " +
    "You provide well-structured Markdown answers, accurate code, and helpful explanations.",
  temperature: 0.7,
  maxOutputTokens: 8192,
  enableGoogleSearch: true,
  enableImageGen: true,
  enableThinking: true,
  enableVoice: true,
  requireCaptchaLogin: true,
  requireCaptchaRegister: true,
  requireCaptchaPrompts: false,
  maintenanceMode: false,
  maintenanceMessage: "Soul Lost is currently undergoing scheduled maintenance. Please check back shortly.",
  announcementActive: false,
  announcementText: "Welcome to Soul Lost AI! High-speed multimodal intelligence.",
  announcementType: "info",
  allowGuestAccess: true,
  starterPrompts: DEFAULT_STARTER_PROMPTS,
  showImagesButton: true,
  showNotebookButton: true,
  showWebSearchButton: true,
  showThinkButton: true,
  showVoiceButton: true,
  showUploadButton: true,
  showAttachButton: true,
  showMemoryButton: true,
  showUpgradeButton: true,
  showShareButton: true,
  showClearAllButton: true,
  showLibraryButton: true,
  showSearchChatsButton: true,
  showNewChatButton: true,
  showDeleteChatButton: true,
  showThemeButton: true,
  showModelSelector: true,
  showEnhanceButton: true,
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

/**
 * Authentication Methods
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  await syncUserProfile(result.user);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }
  await syncUserProfile(result.user, displayName.trim());
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export const signOutUser = logoutUser;

/**
 * 1-Click Super Admin Login for jibon0757j@gmail.com
 * Seamlessly signs in or initializes the Super Admin account without popups
 */
export async function quickSuperAdminLogin(customPassword?: string): Promise<FirebaseUser> {
  const superEmail = SUPER_ADMIN_EMAIL.toLowerCase();
  const passwordToUse = customPassword || "SoulLostAdmin@2026!";
  try {
    const user = await loginWithEmail(superEmail, passwordToUse);
    return user;
  } catch (err: any) {
    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential" ||
      err.code === "auth/wrong-password"
    ) {
      try {
        const user = await registerWithEmail(superEmail, passwordToUse, "Super Admin (Jibon)");
        return user;
      } catch (createErr: any) {
        if (createErr.code === "auth/email-already-in-use") {
          throw new Error(
            `Account ${superEmail} is already registered. If you set a custom password, please enter it in the form below.`
          );
        }
        throw createErr;
      }
    }
    throw err;
  }
}

/**
 * Subscribe to auth state changes and sync profile in real-time
 */
export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await syncUserProfile(firebaseUser);
        callback(profile);
      } catch (err) {
        console.error("Error syncing profile on auth change:", err);
        // Fallback profile if Firestore permission or network is slow
        const isSuper = (firebaseUser.email || "").toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "User"),
          photoURL: firebaseUser.photoURL || "",
          role: isSuper ? "admin" : "user",
          status: "active",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          totalMessages: 0,
          tokensUsed: 0,
        });
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Sync user profile with Firestore document
 */
export async function syncUserProfile(user: FirebaseUser, overrideName?: string): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const isSuper = (user.email || "").toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  let profile: UserProfile;
  const now = new Date().toISOString();

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    profile = {
      ...existing,
      email: user.email || existing.email,
      displayName: overrideName || user.displayName || existing.displayName || (user.email ? user.email.split("@")[0] : "User"),
      photoURL: user.photoURL || existing.photoURL || "",
      role: isSuper ? "admin" : (existing.role || "user"),
      status: existing.status || "active",
      lastLoginAt: now,
    };
    await updateDoc(userRef, {
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      role: profile.role,
      lastLoginAt: profile.lastLoginAt,
    });
  } else {
    profile = {
      uid: user.uid,
      email: user.email || "",
      displayName: overrideName || user.displayName || (user.email ? user.email.split("@")[0] : "Soul Lost User"),
      photoURL: user.photoURL || "",
      role: isSuper ? "admin" : "user",
      status: "active",
      createdAt: now,
      lastLoginAt: now,
      totalMessages: 0,
      tokensUsed: 0,
    };
    await setDoc(userRef, profile);

    // Audit log
    await logAdminActivity("USER_REGISTER", profile.email, profile.uid, `New user registration via ${user.providerData[0]?.providerId || "password"}`);
  }

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

/**
 * Global Admin Config Management (A to Z Customization)
 */
export function subscribeToGlobalConfig(callback: (config: GlobalAdminConfig) => void): () => void {
  const configRef = doc(db, "settings", "global_config");
  return onSnapshot(
    configRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as GlobalAdminConfig;
        const cleanedInstruction = (data.systemInstruction || DEFAULT_GLOBAL_CONFIG.systemInstruction)
          .replace(/inspired by Google Gemini\.?/gi, "created by Soul Lost AI.")
          .replace(/Google Gemini/gi, "Soul Lost AI")
          .replace(/Gemini/gi, "Soul Lost AI");

        const cleanedPrompts = (data.starterPrompts || DEFAULT_STARTER_PROMPTS).map((p) => ({
          ...p,
          title: p.title.replace(/Imagen 3 Studio/gi, "Soul Lost Image Studio").replace(/Gemini/gi, "Soul Lost"),
          prompt: p.prompt.replace(/Gemini/gi, "Soul Lost"),
        }));

        callback({
          ...DEFAULT_GLOBAL_CONFIG,
          ...data,
          systemInstruction: cleanedInstruction,
          starterPrompts: cleanedPrompts,
        });
      } else {
        // Initialize default in Firestore
        setDoc(configRef, DEFAULT_GLOBAL_CONFIG).catch((err) => {
          console.warn("Could not seed default config:", err);
        });
        callback(DEFAULT_GLOBAL_CONFIG);
      }
    },
    (err) => {
      console.error("Config subscription error:", err);
      callback(DEFAULT_GLOBAL_CONFIG);
    }
  );
}

export async function saveGlobalConfig(
  updates: Partial<GlobalAdminConfig>,
  adminEmail: string
): Promise<void> {
  const configRef = doc(db, "settings", "global_config");

  let safeUpdates = { ...updates };

  // If customLogoUrl is a large base64 data string, optimize it down to <50KB
  if (
    safeUpdates.customLogoUrl &&
    typeof safeUpdates.customLogoUrl === "string" &&
    safeUpdates.customLogoUrl.startsWith("data:")
  ) {
    try {
      safeUpdates.customLogoUrl = await optimizeLogoImage(safeUpdates.customLogoUrl, 256, 80 * 1024);
    } catch (optErr) {
      console.warn("Could not auto-compress custom logo:", optErr);
    }
  }

  const payload = {
    ...safeUpdates,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };

  // Estimate JSON size to ensure it never hits Firestore 1,048,576 bytes limit
  const approxSize = new Blob([JSON.stringify(payload)]).size;
  if (approxSize > 900 * 1024) {
    // If somehow still > 900KB, fallback by dropping oversized customLogoUrl
    console.warn(`Configuration payload size (${approxSize} bytes) is near Firestore limit. Sanitizing logo...`);
    if (payload.customLogoUrl && payload.customLogoUrl.startsWith("data:")) {
      payload.customLogoUrl = "";
    }
  }

  await setDoc(configRef, payload, { merge: true });
  await logAdminActivity("UPDATE_GLOBAL_CONFIG", adminEmail, "settings/global_config", `Updated app settings: ${Object.keys(updates).join(", ")}`);
}

/**
 * User Data Management (All Users)
 */
export function subscribeToAllUsers(callback: (users: UserProfile[]) => void): () => void {
  const usersRef = collection(db, "users");
  return onSnapshot(
    usersRef,
    (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      callback(list);
    },
    (err) => {
      console.error("Error subscribing to all users:", err);
    }
  );
}

export async function updateUserByAdmin(
  uid: string,
  updates: Partial<UserProfile>,
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
  await logAdminActivity("UPDATE_USER", adminEmail, uid, `Updated user attributes: ${JSON.stringify(updates)}`);
}

export async function deleteUserByAdmin(uid: string, userEmail: string, adminEmail: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
  await logAdminActivity("DELETE_USER", adminEmail, uid, `Deleted user ${userEmail}`);
}

/**
 * Message Counter Tracking
 */
export async function incrementUserMessageMetrics(uid: string, tokensEstimate: number = 150): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      totalMessages: increment(1),
      tokensUsed: increment(tokensEstimate),
    });
  } catch (e) {
    // Non-fatal
    console.debug("Could not increment user metrics", e);
  }
}

/**
 * Audit / Activity Logging
 */
export async function logAdminActivity(
  action: string,
  actorEmail: string,
  target: string,
  details: string
): Promise<void> {
  try {
    const logsRef = collection(db, "activityLogs");
    const logDoc = doc(logsRef);
    const log: ActivityLog = {
      id: logDoc.id,
      action,
      actorEmail: actorEmail || "system",
      target,
      timestamp: new Date().toISOString(),
      details,
    };
    await setDoc(logDoc, log);
  } catch (e) {
    console.warn("Audit logging failed:", e);
  }
}

export function subscribeToActivityLogs(callback: (logs: ActivityLog[]) => void): () => void {
  const logsRef = collection(db, "activityLogs");
  const q = query(logsRef, orderBy("timestamp", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const logs: ActivityLog[] = [];
      snap.forEach((d) => logs.push(d.data() as ActivityLog));
      callback(logs.slice(0, 50));
    },
    (err) => {
      console.error("Error subscribing to activity logs:", err);
    }
  );
}

/**
 * Default Subscriptions Seed Data
 */
export const DEFAULT_SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Soul Lost Free",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    badge: "Basic",
    description: "Essential intelligence for everyday questions, code, and chat.",
    features: [
      "Soul Lost Flash & 3.8-Flash intelligence",
      "Up to 25,000,000 letters maximum input support",
      "Standard Image Studio access",
      "Google Search live grounding",
      "Personal intelligence & memory storage",
    ],
    modelAccess: ["fruitfly-plus", "fruitfly-pro-lite"],
    maxLettersPerQuestion: 25000000,
    isActive: true,
    color: "#6B7280",
    createdAt: new Date().toISOString(),
  },
  {
    id: "plus",
    name: "Soul Lost Plus",
    priceMonthly: 9.99,
    priceYearly: 99.0,
    currency: "USD",
    badge: "Popular",
    description: "Expanded reasoning power, enhanced image studio, and priority speeds.",
    features: [
      "Soul Lost 3.1 Pro & Pro Lite priority engines",
      "Full 25,000,000 letters per question ingestion",
      "FLUX Photorealistic High-Res Image Generation",
      "Deep reasoning & multi-step thinking modes",
      "Priority streaming without server wait queues",
      "Unlimited session memory & export capabilities",
    ],
    modelAccess: ["fruitfly-plus", "fruitfly-pro-lite", "fruitfly-pro", "fruitfly-image-flux"],
    maxLettersPerQuestion: 25000000,
    isPopular: true,
    isActive: true,
    color: "#1A73E8",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pro",
    name: "Soul Lost Pro",
    priceMonthly: 19.99,
    priceYearly: 199.0,
    currency: "USD",
    badge: "Best Value",
    description: "Maximum intelligence, dedicated capacity, and top-tier AI capabilities.",
    features: [
      "Soul Lost 3.1 Pro Preview with Deep Thinking",
      "Full 25M massive context window & file processing",
      "Unrestricted FLUX Image Studio + Prompt Enhancement",
      "Real-time voice TTS models (Kore, Puck, Fenrir, Zephyr)",
      "Zero rate limits & peak-hour high throughput",
      "Early beta access to new experimental models",
    ],
    modelAccess: ["fruitfly-plus", "fruitfly-pro-lite", "fruitfly-pro", "fruitfly-image-flux", "fruitfly-voice"],
    maxLettersPerQuestion: 25000000,
    isActive: true,
    color: "#A4C639",
    createdAt: new Date().toISOString(),
  },
  {
    id: "enterprise",
    name: "Soul Lost Enterprise",
    priceMonthly: 49.99,
    priceYearly: 499.0,
    currency: "USD",
    badge: "Ultimate",
    description: "Tailored for organizations, multi-seat teams, and high-frequency workloads.",
    features: [
      "Custom quota overrides & SLA guarantee",
      "Admin command console & member tier provisioning",
      "Unlimited 25M letters processing & file analysis",
      "Dedicated high-speed inference pipeline",
      "Custom system personas & domain memory",
      "Direct Priority Support & Admin Logs",
    ],
    modelAccess: ["fruitfly-plus", "fruitfly-pro-lite", "fruitfly-pro", "fruitfly-image-flux", "fruitfly-voice", "fruitfly-enterprise"],
    maxLettersPerQuestion: 25000000,
    isActive: true,
    color: "#9333EA",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Subscribe to Subscriptions collection (real-time)
 */
export function subscribeToSubscriptions(callback: (plans: SubscriptionPlan[]) => void): () => void {
  const subRef = collection(db, "subscriptions");
  return onSnapshot(
    subRef,
    (snap) => {
      if (snap.empty) {
        // Seed default subscriptions
        DEFAULT_SUBSCRIPTIONS.forEach((plan) => {
          setDoc(doc(db, "subscriptions", plan.id), plan).catch((err) =>
            console.warn("Could not seed default subscription plan:", err)
          );
        });
        callback(DEFAULT_SUBSCRIPTIONS);
      } else {
        const plans: SubscriptionPlan[] = [];
        snap.forEach((d) => plans.push(d.data() as SubscriptionPlan));
        callback(plans);
      }
    },
    (err) => {
      console.error("Error subscribing to subscriptions:", err);
      callback(DEFAULT_SUBSCRIPTIONS);
    }
  );
}

export async function saveSubscriptionPlan(
  plan: SubscriptionPlan,
  adminEmail: string
): Promise<void> {
  const planRef = doc(db, "subscriptions", plan.id);
  await setDoc(planRef, { ...plan, updatedAt: new Date().toISOString() }, { merge: true });
  await logAdminActivity("SAVE_SUBSCRIPTION_PLAN", adminEmail, `subscriptions/${plan.id}`, `Saved plan: ${plan.name} ($${plan.priceMonthly}/mo)`);
}

export async function deleteSubscriptionPlan(
  planId: string,
  adminEmail: string
): Promise<void> {
  await deleteDoc(doc(db, "subscriptions", planId));
  await logAdminActivity("DELETE_SUBSCRIPTION_PLAN", adminEmail, `subscriptions/${planId}`, `Deleted subscription plan: ${planId}`);
}

/**
 * Admin: Assign or change any user's subscription
 */
export async function setUserSubscriptionByAdmin(
  uid: string,
  subscriptionData: {
    subscriptionTier: string;
    subscriptionStatus: "active" | "trial" | "expired" | "cancelled" | "lifetime";
    subscriptionExpiresAt?: string;
    customQuotaLetters?: number;
  },
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...subscriptionData,
    updatedAt: new Date().toISOString(),
  });
  await logAdminActivity(
    "UPDATE_USER_SUBSCRIPTION",
    adminEmail,
    `users/${uid}`,
    `Assigned plan: ${subscriptionData.subscriptionTier} (Status: ${subscriptionData.subscriptionStatus})`
  );
}

/**
 * Default App Versions Seed Data
 */
export const DEFAULT_APP_VERSIONS: AppVersion[] = [
  {
    id: "v2.5.0",
    versionNumber: "v2.5.0",
    releaseDate: new Date().toISOString().split("T")[0],
    title: "25M High-Capacity Text Engine & Admin Subscriptions",
    changelog: [
      "Implemented 25,000,000 letters maximum per-question processing capacity",
      "Added Admin Panel Subscription Manager: customize, add, and remove tiers",
      "Added Admin User Subscription Assignment: manage all user memberships & status",
      "Added App & Model Versions Manager in Admin Command Center",
      "Added Memory Export to Soul Lost (.json, .txt, clipboard)",
      "Fixed dark mode toggle & CSS theme synchronization",
    ],
    status: "active",
    recommendedModel: "fruitfly-plus",
    isCurrent: true,
  },
  {
    id: "v2.4.0",
    versionNumber: "v2.4.0",
    releaseDate: "2026-08-15",
    title: "A-to-Z Customization & Soul Lost Image Studio",
    changelog: [
      "FLUX Photorealistic high-resolution image engine integration",
      "Deep reasoning & multi-step thinking levels",
      "Custom branding, logo customization, and theme accents",
      "Full user auditing & activity logging in Admin Panel",
    ],
    status: "active",
    recommendedModel: "fruitfly-pro",
    isCurrent: false,
  },
  {
    id: "v2.0.0",
    versionNumber: "v2.0.0",
    releaseDate: "2026-07-01",
    title: "Multimodal Voice & Personal Intelligence",
    changelog: [
      "High-fidelity TTS speech synthesis (Kore, Puck, Fenrir, Zephyr)",
      "Personal intelligence memory storage & context recall",
      "Live Google Search grounding",
    ],
    status: "deprecated",
    recommendedModel: "fruitfly-plus",
    isCurrent: false,
  },
];

/**
 * Subscribe to Versions collection (real-time)
 */
export function subscribeToVersions(callback: (versions: AppVersion[]) => void): () => void {
  const vRef = collection(db, "versions");
  return onSnapshot(
    vRef,
    (snap) => {
      if (snap.empty) {
        // Seed default versions
        DEFAULT_APP_VERSIONS.forEach((v) => {
          setDoc(doc(db, "versions", v.id), v).catch((err) =>
            console.warn("Could not seed default app version:", err)
          );
        });
        callback(DEFAULT_APP_VERSIONS);
      } else {
        const versions: AppVersion[] = [];
        snap.forEach((d) => versions.push(d.data() as AppVersion));
        // Sort by version id descending
        versions.sort((a, b) => b.versionNumber.localeCompare(a.versionNumber));
        callback(versions);
      }
    },
    (err) => {
      console.error("Error subscribing to versions:", err);
      callback(DEFAULT_APP_VERSIONS);
    }
  );
}

export async function saveAppVersion(
  version: AppVersion,
  adminEmail: string
): Promise<void> {
  const vRef = doc(db, "versions", version.id);
  await setDoc(vRef, { ...version, updatedAt: new Date().toISOString() }, { merge: true });
  await logAdminActivity("SAVE_APP_VERSION", adminEmail, `versions/${version.id}`, `Saved version: ${version.versionNumber} - ${version.title}`);
}

export async function deleteAppVersion(
  versionId: string,
  adminEmail: string
): Promise<void> {
  await deleteDoc(doc(db, "versions", versionId));
  await logAdminActivity("DELETE_APP_VERSION", adminEmail, `versions/${versionId}`, `Deleted version: ${versionId}`);
}

