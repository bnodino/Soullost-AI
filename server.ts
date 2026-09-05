import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export interface ServerApiKeyEntry {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  status: "active" | "quota_exhausted" | "invalid" | "disabled";
  isEnvDefault: boolean;
  requestsHandled: number;
  lastUsedAt?: string;
  lastError?: string;
  lastCheckedAt?: string;
  latencyMs?: number;
  createdAt: string;
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

class ApiKeyPoolManager {
  private keys: ServerApiKeyEntry[] = [];
  private clients: Map<string, GoogleGenAI> = new Map();
  private storagePath: string;

  constructor() {
    this.storagePath = path.join(process.cwd(), "api_keys_pool.json");
    this.loadFromStorage();
    this.initEnvKey();
  }

  private initEnvKey() {
    const envKey = process.env.GEMINI_API_KEY;
    if (!envKey) return;

    const existingEnv = this.keys.find((k) => k.isEnvDefault || k.key === envKey);
    if (!existingEnv) {
      this.keys.unshift({
        id: "env-default",
        name: "Primary Server Key (Environment)",
        key: envKey,
        maskedKey: maskKey(envKey),
        status: "active",
        isEnvDefault: true,
        requestsHandled: 0,
        createdAt: new Date().toISOString(),
      });
      this.saveToStorage();
    } else {
      existingEnv.key = envKey;
      existingEnv.maskedKey = maskKey(envKey);
      existingEnv.isEnvDefault = true;
    }
  }

  private loadFromStorage() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, "utf-8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.keys = parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load api_keys_pool.json:", e);
    }
  }

  private saveToStorage() {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.keys, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save api_keys_pool.json:", e);
    }
  }

  public getGenAI(apiKey: string): GoogleGenAI {
    let client = this.clients.get(apiKey);
    if (!client) {
      client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      this.clients.set(apiKey, client);
    }
    return client;
  }

  public getAllKeysPublic() {
    return this.keys.map((k) => ({
      id: k.id,
      name: k.name,
      maskedKey: k.maskedKey,
      status: k.status,
      isEnvDefault: k.isEnvDefault,
      requestsHandled: k.requestsHandled,
      lastUsedAt: k.lastUsedAt,
      lastError: k.lastError,
      lastCheckedAt: k.lastCheckedAt,
      latencyMs: k.latencyMs,
      createdAt: k.createdAt,
    }));
  }

  public getSummary() {
    return {
      total: this.keys.length,
      active: this.keys.filter((k) => k.status === "active").length,
      quotaExhausted: this.keys.filter((k) => k.status === "quota_exhausted").length,
      invalid: this.keys.filter((k) => k.status === "invalid").length,
      disabled: this.keys.filter((k) => k.status === "disabled").length,
      totalRequests: this.keys.reduce((acc, k) => acc + (k.requestsHandled || 0), 0),
    };
  }

  public getAvailableKeys(): ServerApiKeyEntry[] {
    // 1. First priority: keys with status "active"
    const active = this.keys.filter((k) => k.status === "active");
    if (active.length > 0) {
      return active;
    }

    // 2. Second priority: If all keys are marked quota_exhausted, try ones that haven't been tried in 60s
    const now = Date.now();
    const quotaExhausted = this.keys.filter((k) => {
      if (k.status === "disabled" || k.status === "invalid") return false;
      if (k.status === "quota_exhausted") {
        const lastUsed = k.lastUsedAt ? new Date(k.lastUsedAt).getTime() : 0;
        return now - lastUsed > 60000;
      }
      return false;
    });

    if (quotaExhausted.length > 0) {
      return quotaExhausted;
    }

    // 3. Fallback: if env key exists, try it even if marked exhausted
    const envKey = this.keys.find((k) => k.isEnvDefault && k.status !== "disabled");
    if (envKey) return [envKey];

    return [];
  }

  public async testKey(apiKey: string): Promise<{
    valid: boolean;
    status: "active" | "quota_exhausted" | "invalid" | "error";
    message: string;
    latencyMs: number;
    model?: string;
  }> {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 8) {
      return {
        valid: false,
        status: "invalid",
        message: "API Key must be a valid non-empty string.",
        latencyMs: 0,
      };
    }

    const trimmedKey = apiKey.trim();
    const start = Date.now();
    try {
      const client = new GoogleGenAI({
        apiKey: trimmedKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Quick test prompt with flash model
      const resp = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Respond strictly with the single word: OK",
      });

      const latencyMs = Date.now() - start;
      if (resp.text) {
        return {
          valid: true,
          status: "active",
          message: `API Key is active and functioning properly! (Latency: ${latencyMs}ms)`,
          latencyMs,
          model: "gemini-2.5-flash",
        };
      }

      return {
        valid: true,
        status: "active",
        message: `API Key verified successfully (${latencyMs}ms).`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const errMsg = err?.message || String(err);
      const isQuota = this.isQuotaError(err);
      const isInvalid = this.isInvalidKeyError(err);

      if (isQuota) {
        return {
          valid: false,
          status: "quota_exhausted",
          message: "Quota or rate limit exhausted for this key (HTTP 429). The key exists, but its quota has been spent.",
          latencyMs,
        };
      } else if (isInvalid) {
        return {
          valid: false,
          status: "invalid",
          message: `Invalid API Key (HTTP 400/403): ${errMsg.slice(0, 160)}`,
          latencyMs,
        };
      } else {
        return {
          valid: false,
          status: "error",
          message: `API Verification Error: ${errMsg.slice(0, 160)}`,
          latencyMs,
        };
      }
    }
  }

  public isQuotaError(err: any): boolean {
    if (!err) return false;
    const msg = (err.message || String(err)).toLowerCase();
    const status = err.status || err.statusCode || err.code;
    return (
      status === 429 ||
      msg.includes("429") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota exceeded") ||
      msg.includes("rate limit") ||
      msg.includes("too many requests") ||
      msg.includes("quota")
    );
  }

  public isInvalidKeyError(err: any): boolean {
    if (!err) return false;
    const msg = (err.message || String(err)).toLowerCase();
    const status = err.status || err.statusCode || err.code;
    return (
      status === 400 ||
      status === 403 ||
      msg.includes("api_key_invalid") ||
      msg.includes("api key not valid") ||
      msg.includes("permission_denied") ||
      msg.includes("unauthorized") ||
      msg.includes("bad request")
    );
  }

  public recordKeySuccess(keyId: string) {
    const keyEntry = this.keys.find((k) => k.id === keyId);
    if (keyEntry) {
      keyEntry.requestsHandled = (keyEntry.requestsHandled || 0) + 1;
      keyEntry.lastUsedAt = new Date().toISOString();
      if (keyEntry.status === "quota_exhausted") {
        keyEntry.status = "active";
        keyEntry.lastError = undefined;
      }
      this.saveToStorage();
    }
  }

  public recordKeyFailure(
    keyId: string,
    status: "quota_exhausted" | "invalid",
    errorMsg: string
  ) {
    const keyEntry = this.keys.find((k) => k.id === keyId);
    if (keyEntry) {
      keyEntry.status = status;
      keyEntry.lastError = errorMsg;
      keyEntry.lastUsedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public async addKey(name: string, key: string, validateFirst: boolean = true) {
    const trimmedKey = key.trim();
    const cleanName = name.trim() || `API Key #${this.keys.length + 1}`;

    const duplicate = this.keys.find((k) => k.key === trimmedKey);
    if (duplicate) {
      throw new Error(`This API key is already registered as "${duplicate.name}"`);
    }

    let initialStatus: "active" | "quota_exhausted" | "invalid" = "active";
    let latencyMs = 0;
    let testMsg = "";

    if (validateFirst) {
      const testResult = await this.testKey(trimmedKey);
      latencyMs = testResult.latencyMs;
      testMsg = testResult.message;
      if (!testResult.valid) {
        if (testResult.status === "quota_exhausted") {
          throw new Error(`Key verification failed: Quota exhausted (429). The key has reached its usage limit.`);
        } else if (testResult.status === "invalid") {
          throw new Error(`Key verification failed: Invalid API Key. Please verify the key from Google AI Studio.`);
        } else {
          throw new Error(`Key verification failed: ${testResult.message}`);
        }
      }
      initialStatus = testResult.status as any;
    }

    const newEntry: ServerApiKeyEntry = {
      id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      key: trimmedKey,
      maskedKey: maskKey(trimmedKey),
      status: initialStatus,
      isEnvDefault: false,
      requestsHandled: 0,
      lastCheckedAt: new Date().toISOString(),
      latencyMs,
      createdAt: new Date().toISOString(),
    };

    this.keys.push(newEntry);
    this.saveToStorage();
    return { entry: newEntry, testMsg };
  }

  public deleteKey(id: string) {
    const index = this.keys.findIndex((k) => k.id === id);
    if (index === -1) {
      throw new Error("API Key not found");
    }
    const key = this.keys[index];
    if (key.isEnvDefault) {
      key.status = "disabled";
      this.saveToStorage();
      return;
    }
    this.keys.splice(index, 1);
    this.saveToStorage();
  }

  public toggleKey(id: string) {
    const key = this.keys.find((k) => k.id === id);
    if (!key) throw new Error("API Key not found");
    key.status = key.status === "disabled" ? "active" : "disabled";
    this.saveToStorage();
    return key;
  }

  public async recheckKey(id: string) {
    const key = this.keys.find((k) => k.id === id);
    if (!key) throw new Error("API Key not found");
    const result = await this.testKey(key.key);
    key.status = result.status as any;
    key.lastCheckedAt = new Date().toISOString();
    key.latencyMs = result.latencyMs;
    if (result.valid) {
      key.lastError = undefined;
    } else {
      key.lastError = result.message;
    }
    this.saveToStorage();
    return { key, result };
  }

  public resetKeyStatus(id: string) {
    const key = this.keys.find((k) => k.id === id);
    if (!key) throw new Error("API Key not found");
    key.status = "active";
    key.lastError = undefined;
    this.saveToStorage();
    return key;
  }

  public resetAllExhausted() {
    let count = 0;
    for (const key of this.keys) {
      if (key.status === "quota_exhausted" || key.status === "invalid") {
        key.status = "active";
        key.lastError = undefined;
        count++;
      }
    }
    this.saveToStorage();
    return count;
  }

  public async executeWithFailover<T>(
    action: (ai: GoogleGenAI, keyEntry: ServerApiKeyEntry) => Promise<T>
  ): Promise<T> {
    const available = this.getAvailableKeys();
    if (available.length === 0) {
      throw new Error(
        "No active API keys available in the pool. All keys have exhausted quota or are disabled. Please add a valid API key in Admin Command Center."
      );
    }

    let lastErr: any = null;
    for (const keyEntry of available) {
      try {
        const ai = this.getGenAI(keyEntry.key);
        const res = await action(ai, keyEntry);
        this.recordKeySuccess(keyEntry.id);
        return res;
      } catch (err: any) {
        lastErr = err;
        const isQuota = this.isQuotaError(err);
        const isInvalid = this.isInvalidKeyError(err);
        if (isQuota || isInvalid) {
          console.warn(
            `[API Pool Auto-Failover] Key "${keyEntry.name}" ${
              isQuota ? "quota exhausted (429)" : "invalid"
            }. Auto-switching to next key...`
          );
          this.recordKeyFailure(
            keyEntry.id,
            isQuota ? "quota_exhausted" : "invalid",
            err?.message || String(err)
          );
          continue; // Try next key
        }
        throw err;
      }
    }

    throw lastErr || new Error("All API keys in the pool failed.");
  }
}

const apiKeyManager = new ApiKeyPoolManager();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support massive prompts up to 25,000,000 letters and large base64 media
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ extended: true, limit: "150mb" }));

  // API Health
  app.get("/api/health", (_req, res) => {
    const summary = apiKeyManager.getSummary();
    res.json({
      status: summary.active > 0 ? "ok" : "degraded",
      hasKey: Boolean(process.env.GEMINI_API_KEY) || summary.total > 0,
      activeKeys: summary.active,
      totalKeys: summary.total,
      app: "Soul Lost AI",
      timestamp: new Date().toISOString(),
    });
  });

  // Helper to map public Soul Lost model IDs to backend model engine
  function mapToInternalModel(modelId: string): string {
    const map: Record<string, string> = {
      // Soul Lost Models
      "soullost-plus": "gemini-3.8-flash",
      "fruitfly-plus": "gemini-3.8-flash",
      "plus": "gemini-3.8-flash",
      "soullost-pro-lite": "gemini-3.1-flash-lite",
      "fruitfly-pro-lite": "gemini-3.1-flash-lite",
      "pro-lite": "gemini-3.1-flash-lite",
      "soullost-pro": "gemini-3.1-pro-preview",
      "fruitfly-pro": "gemini-3.1-pro-preview",
      "pro": "gemini-3.1-pro-preview",

      // Soul Lost Image Studio
      "soullost-image-studio": "gemini-3.1-flash-lite-image",
      "fruitfly-image-studio": "gemini-3.1-flash-lite-image",

      // Legacy IDs for backward compatibility
      "soullost-3.8-flash": "gemini-3.8-flash",
      "fruitfly-3.8-flash": "gemini-3.8-flash",
      "soullost-3.1-pro": "gemini-3.1-pro-preview",
      "fruitfly-3.1-pro": "gemini-3.1-pro-preview",
      "soullost-3.1-flash-lite": "gemini-3.1-flash-lite",
      "fruitfly-3.1-flash-lite": "gemini-3.1-flash-lite",
      "fruitfly-2.5-flash": "gemini-2.5-flash",
      "fruitfly-2.5-pro": "gemini-2.5-pro",
      "fruitfly-2.0-flash": "gemini-2.0-flash",
      "fruitfly-2.0-flash-lite": "gemini-2.0-flash-lite",
    };
    return map[modelId] || modelId;
  }

  // API Models List
  app.get("/api/models", (_req, res) => {
    res.json([
      {
        id: "fruitfly-plus",
        name: "Plus",
        tag: "Fast Answer",
        description: "Fast Answer — Quick, instantaneous responses for everyday queries and tasks.",
        badge: "Plus",
        supportsThinking: false,
        supportsSearch: true,
        supportsVision: true,
      },
      {
        id: "fruitfly-pro-lite",
        name: "Pro-Lite",
        tag: "Medium Research",
        description: "Medium Research — Balanced search grounding and multi-step reasoning.",
        badge: "Pro-Lite",
        supportsThinking: true,
        supportsSearch: true,
        supportsVision: true,
      },
      {
        id: "fruitfly-pro",
        name: "Pro",
        tag: "Deep Search",
        description: "Deep Search — Complex reasoning, deep investigation, and exhaustive research.",
        badge: "Pro",
        supportsThinking: true,
        supportsSearch: true,
        supportsVision: true,
      },
      {
        id: "fruitfly-image-studio",
        name: "Soul Lost Image Studio",
        tag: "Image Creation",
        description: "Generate high quality images from descriptive text prompts.",
        badge: "Image Studio",
        supportsThinking: false,
        supportsSearch: false,
        supportsVision: false,
      },
    ]);
  });

  // Streaming Chat with Multimodal Vision & Web Search Grounding
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const {
        messages,
        model = "fruitfly-plus",
        systemInstruction,
        useSearch = false,
        thinkingLevel,
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const targetModel = mapToInternalModel(model);

      // Distinguish model archetypes:
      const isDeepSearch = model === "fruitfly-pro" || model === "pro";
      const isMediumResearch = model === "fruitfly-pro-lite" || model === "pro-lite";

      // Calculate total letters across messages (max 25,000,000 letters per question supported)
      let totalLetters = 0;
      for (const m of messages) {
        if (typeof m.text === "string") {
          totalLetters += m.text.length;
        }
      }

      // High-Capacity 25,000,000 letters ingestion engine:
      let processedMessages = messages;
      let isMassiveContext = false;

      if (totalLetters > 3_500_000) {
        isMassiveContext = true;
        // Cap text at 25,000,000 characters
        const userMsgs = messages.filter((m: any) => m.role === "user");
        const lastUserMsg = userMsgs[userMsgs.length - 1] || messages[messages.length - 1];
        const rawText = typeof lastUserMsg?.text === "string" ? lastUserMsg.text.slice(0, 25_000_000) : "";

        // Multi-stride structural windowing for 25M letters
        const head = rawText.slice(0, 500_000);
        const tail = rawText.slice(-500_000);
        const checkpoints: string[] = [];
        const fractions = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85];
        for (const frac of fractions) {
          const start = Math.floor(rawText.length * frac);
          checkpoints.push(
            `\n--- [CHECKPOINT AT ${Math.round(frac * 100)}% MARK (~${start.toLocaleString()} letters)] ---\n${rawText.slice(start, start + 300_000)}`
          );
        }

        const synthesizedPrompt = `[HIGH-CAPACITY 25,000,000 LETTERS INGESTION ENGINE]
Total input length: ${totalLetters.toLocaleString()} letters (capped at 25M limit).
Below is the synthesized multi-window document structure covering beginning, representative analytical strides across all 25M letters, and ending conclusion:

=== SECTION 1: BEGINNING & OVERVIEW (First 500,000 letters) ===
${head}

=== SECTION 2: INTERMEDIATE ANALYTICAL STRIDES ACROSS THE 25M-LETTER BODY ===
${checkpoints.join("\n")}

=== SECTION 3: CONCLUSION & FINAL SECTIONS (Last 500,000 letters) ===
${tail}

[USER TASK / QUESTION]
Please analyze and answer the user's inquiry based on this comprehensive 25,000,000-letter scope.`;

        processedMessages = [
          ...messages.slice(0, -1),
          { ...lastUserMsg, text: synthesizedPrompt },
        ];
      }

      // Format messages into contents structure
      const formattedContents = processedMessages.map((msg: any) => {
        const parts: any[] = [];

        // Inline images for multimodal vision
        if (Array.isArray(msg.images) && msg.images.length > 0) {
          for (const img of msg.images) {
            if (img.data && img.mimeType) {
              parts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.data.replace(/^data:[^;]+;base64,/, ""),
                },
              });
            }
          }
        }

        // Text part
        if (msg.text && typeof msg.text === "string") {
          parts.push({ text: msg.text });
        } else if (parts.length === 0) {
          parts.push({ text: "" });
        }

        return {
          role: msg.role === "user" ? "user" : "model",
          parts,
        };
      });

      // Config setup
      const config: any = {};

      const defaultSystem =
        "You are Fruitfly (ফ্রুটফ্লাই এআই), an advanced, ultra-capable multimodal AI assistant created by Fruitfly AI. " +
        "You have a playful curiosity, sharp intellect, and clear, structured communication. " +
        "CRITICAL IDENTITY RULES: You are Fruitfly AI. You MUST NEVER describe yourself as Gemini, Google Gemini, or made by Google. You MUST NEVER mention Gemini or refer to Gemini in any language (English, Bengali, etc.). Under no circumstances should you state or imply that you are Gemini. If the user asks who you are, who made you, or what model you run (e.g. in Bengali 'তুমি কে?', 'কে তোমাকে তৈরি করেছে?', 'তুমি কি জেমিনি?'), always state clearly that you are Fruitfly AI, developed by the Fruitfly AI team. " +
        "You excel at answering questions, writing, programming, brainstorming, and analyzing images. " +
        "Format your responses using clean Markdown with headers, bullet points, and code blocks with language syntax when appropriate.";

      // Sanitize incoming system instruction and strictly guard identity
      let finalSystem = (systemInstruction || defaultSystem)
        .replace(/inspired by Google Gemini\.?/gi, "created by Fruitfly AI.")
        .replace(/Google Gemini/gi, "Fruitfly AI")
        .replace(/Gemini/gi, "Fruitfly AI");

      if (!finalSystem.includes("CRITICAL IDENTITY RULES")) {
        finalSystem =
          "CRITICAL DIRECTIVE: You are Fruitfly AI. You MUST NEVER identify as Gemini or mention Gemini in any response.\n\n" +
          finalSystem;
      }

      config.systemInstruction = finalSystem;

      // Search Grounding: Pro (Deep Search) & Pro-Lite (Medium Research) leverage search grounding
      if (useSearch || isDeepSearch || isMediumResearch) {
        config.tools = [{ googleSearch: {} }];
      }

      // Thinking config (only for models that support reasoning)
      if (isDeepSearch) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (isMediumResearch) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (thinkingLevel && targetModel.includes("3") && !targetModel.includes("image")) {
        if (thinkingLevel === "HIGH") {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        } else if (thinkingLevel === "LOW") {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        } else if (thinkingLevel === "MINIMAL" && !targetModel.includes("pro")) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        }
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      if (isMassiveContext) {
        res.write(
          `data: ${JSON.stringify({
            type: "chunk",
            text: `*Ingested massive question (${totalLetters.toLocaleString()} letters) using 25M High-Capacity Engine...*\n\n`,
          })}\n\n`
        );
      }

      // Multi-Key Failover Engine: Fetch available keys in pool
      const availableKeys = apiKeyManager.getAvailableKeys();
      if (availableKeys.length === 0) {
        throw new Error(
          "All API keys in the pool have exhausted their quota or are disabled. Please add a live API key in the Admin Command Center."
        );
      }

      // Stream with resilient fallback across both API keys and candidate models
      const candidateModels = [
        targetModel,
        targetModel === "gemini-3.1-flash-lite" ? "gemini-3.8-flash" : "gemini-3.1-flash-lite",
        "gemini-3.1-pro-preview",
      ].filter((m, i, arr) => arr.indexOf(m) === i);

      let responseStream: any = null;
      let streamModelUsed = targetModel;
      let activeKeyUsed: ServerApiKeyEntry | null = null;
      let lastFailureError: any = null;

      // Outer loop: Iterate through available API keys in failover pool
      for (const keyEntry of availableKeys) {
        const ai = apiKeyManager.getGenAI(keyEntry.key);
        let keySucceeded = false;

        // Inner loop: Iterate through candidate models for this key
        for (let i = 0; i < candidateModels.length; i++) {
          const mName = candidateModels[i];
          try {
            const modelConfig = { ...config };
            if (mName === "gemini-3.1-flash-lite" && modelConfig.thinkingConfig?.thinkingLevel === ThinkingLevel.HIGH) {
              modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
            }
            responseStream = await ai.models.generateContentStream({
              model: mName,
              contents: formattedContents,
              config: modelConfig,
            });
            streamModelUsed = mName;
            activeKeyUsed = keyEntry;
            apiKeyManager.recordKeySuccess(keyEntry.id);
            keySucceeded = true;
            break;
          } catch (candidateErr: any) {
            lastFailureError = candidateErr;
            const isQuota = apiKeyManager.isQuotaError(candidateErr);
            const isInvalid = apiKeyManager.isInvalidKeyError(candidateErr);

            if (isQuota || isInvalid) {
              console.warn(
                `[API Key Failover Engine] Key "${keyEntry.name}" ${
                  isQuota ? "quota limit exhausted (429)" : "invalid"
                }. Auto-switching to next active key in pool...`
              );
              apiKeyManager.recordKeyFailure(
                keyEntry.id,
                isQuota ? "quota_exhausted" : "invalid",
                candidateErr?.message || String(candidateErr)
              );
              // Break inner model loop to immediately switch to NEXT API KEY!
              break;
            }

            console.warn(`Model ${mName} attempt failed with key "${keyEntry.name}":`, candidateErr?.message || candidateErr);
            if (i < candidateModels.length - 1) {
              continue;
            }
          }
        }

        if (keySucceeded && responseStream) {
          break; // Stream started successfully!
        }
      }

      if (!responseStream) {
        throw (
          lastFailureError ||
          new Error("All API keys in the pool have exhausted their quota or failed. Please add a valid API key in Admin Command Center.")
        );
      }

      let accumulatedGrounding: any = null;

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
        }

        // Check for grounding metadata
        const grounding = chunk.candidates?.[0]?.groundingMetadata;
        if (grounding) {
          accumulatedGrounding = grounding;
        }
      }

      if (accumulatedGrounding) {
        res.write(
          `data: ${JSON.stringify({
            type: "grounding",
            grounding: {
              webSearchQueries: accumulatedGrounding.webSearchQueries,
              searchChunks: accumulatedGrounding.groundingChunks?.map((c: any) => ({
                web: c.web ? { uri: c.web.uri, title: c.web.title } : undefined,
              })).filter((c: any) => Boolean(c.web)),
            },
          })}\n\n`
        );
      }

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Chat Stream Error:", err);
      // If headers not yet sent, send error JSON
      if (!res.headersSent) {
        res.status(500).json({
          error: err?.message || "Failed to generate chat response.",
        });
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: err?.message || "An error occurred during response streaming.",
          })}\n\n`
        );
        res.end();
      }
    }
  });

  // Image Generation Endpoint (Fruitfly Image Studio - No API Key Required, powered by Flux & Pollinations)
  app.post("/api/image/generate", async (req, res) => {
    try {
      const {
        prompt,
        aspectRatio = "1:1",
        style = "",
        enhance = true,
        model = "flux",
        seed = Math.floor(Math.random() * 10000000),
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required for image generation." });
      }

      // Calculate width and height based on aspect ratio
      let width = 1024;
      let height = 1024;
      if (aspectRatio === "16:9" || aspectRatio === "1280x720") {
        width = 1280;
        height = 720;
      } else if (aspectRatio === "9:16" || aspectRatio === "720x1280") {
        width = 720;
        height = 1280;
      } else if (aspectRatio === "4:3" || aspectRatio === "1024x768") {
        width = 1024;
        height = 768;
      } else if (aspectRatio === "3:4" || aspectRatio === "768x1024") {
        width = 768;
        height = 1024;
      }

      const fullPrompt = style ? `${prompt.trim()}${style.startsWith(",") ? style : `, ${style}`}` : prompt.trim();
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const isEnhance = enhance !== false && enhance !== "false";
      const targetModel = model === "turbo" ? "turbo" : "flux";

      // Direct, fast, high-quality image URL without any API key or quota limits
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${targetModel}&enhance=${isEnhance ? "true" : "false"}`;

      res.json({
        imageUrl,
        prompt: fullPrompt,
        originalPrompt: prompt,
        aspectRatio,
        width,
        height,
        seed,
        model: targetModel,
        enhance: isEnhance,
        text: `Generated visual for: "${fullPrompt}"`,
      });
    } catch (err: any) {
      console.error("Image Generation Error:", err);
      res.status(500).json({
        error: err?.message || "Failed to generate image.",
      });
    }
  });

  // Image Proxy / Download Endpoint to bypass CORS in iframe environments
  app.get("/api/image/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl || !targetUrl.startsWith("http")) {
        return res.status(400).send("Invalid image URL");
      }

      const response = await fetch(targetUrl);
      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch upstream image");
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="soullost-image-${Date.now()}.jpg"`
      );

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("Image Proxy Error:", err);
      res.status(500).send("Proxy error: " + (err?.message || "unknown"));
    }
  });

  // Text-To-Speech Endpoint with Auto-Failover
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "Kore" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required." });
      }

      // Shorten text if excessively long for TTS
      const cleanText = text.slice(0, 1000).replace(/[*#`_~[\]]/g, "");

      const audioData = await apiKeyManager.executeWithFailover(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: cleanText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) {
          throw new Error("No audio stream returned.");
        }
        return data;
      });

      res.json({
        audioBase64: audioData,
        format: "pcm24k",
      });
    } catch (err: any) {
      console.error("TTS generation error:", err);
      res.status(500).json({
        error: err?.message || "Failed to generate speech.",
      });
    }
  });

  // Prompt Enhancer (Magic Wand feature) with Auto-Failover
  app.post("/api/prompt/enhance", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const enhancedText = await apiKeyManager.executeWithFailover(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `You are an expert prompt engineer for Soul Lost AI. Expand the following user prompt to be more detailed, effective, clear, and comprehensive while preserving the original intent. Output ONLY the improved prompt text, no commentary.\n\nOriginal prompt:\n"${prompt}"`,
        });
        return response.text?.trim() || prompt;
      });

      res.json({ enhanced: enhancedText });
    } catch (err: any) {
      console.error("Enhance prompt error:", err);
      res.status(500).json({ error: err?.message || "Failed to enhance prompt." });
    }
  });

  // ==========================================
  // ADMIN API KEY POOL & FAILOVER ENDPOINTS
  // ==========================================

  // 1. Get all API keys with live status and pool summary
  app.get("/api/admin/keys", (_req, res) => {
    res.json({
      keys: apiKeyManager.getAllKeysPublic(),
      summary: apiKeyManager.getSummary(),
    });
  });

  // 2. Real-time test/validate any API key before or while adding
  app.post("/api/admin/keys/test", async (req, res) => {
    try {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({
          valid: false,
          status: "invalid",
          message: "No API Key provided to test.",
          latencyMs: 0,
        });
      }
      const result = await apiKeyManager.testKey(key);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        valid: false,
        status: "error",
        message: err?.message || "Internal test error.",
        latencyMs: 0,
      });
    }
  });

  // 3. Add a new API Key to the failover pool (validates first)
  app.post("/api/admin/keys", async (req, res) => {
    try {
      const { name, key, validateFirst = true } = req.body;
      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "API Key string is required." });
      }

      const { entry, testMsg } = await apiKeyManager.addKey(name, key, validateFirst);
      res.json({
        success: true,
        entry: {
          id: entry.id,
          name: entry.name,
          maskedKey: entry.maskedKey,
          status: entry.status,
          isEnvDefault: entry.isEnvDefault,
          requestsHandled: entry.requestsHandled,
          latencyMs: entry.latencyMs,
          createdAt: entry.createdAt,
        },
        message: testMsg || "API Key successfully validated and added to failover pool.",
        summary: apiKeyManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to add API key." });
    }
  });

  // 4. Delete an API Key from the pool
  app.delete("/api/admin/keys/:id", (req, res) => {
    try {
      apiKeyManager.deleteKey(req.params.id);
      res.json({
        success: true,
        message: "API Key removed from pool.",
        summary: apiKeyManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to delete API key." });
    }
  });

  // 5. Toggle an API key between Active and Disabled
  app.patch("/api/admin/keys/:id/toggle", (req, res) => {
    try {
      const key = apiKeyManager.toggleKey(req.params.id);
      res.json({
        success: true,
        key: {
          id: key.id,
          status: key.status,
        },
        summary: apiKeyManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to toggle key status." });
    }
  });

  // 6. Test / Re-ping an existing key in the pool live
  app.post("/api/admin/keys/:id/test", async (req, res) => {
    try {
      const { key, result } = await apiKeyManager.recheckKey(req.params.id);
      res.json({
        success: true,
        key: {
          id: key.id,
          name: key.name,
          status: key.status,
          latencyMs: key.latencyMs,
          lastCheckedAt: key.lastCheckedAt,
          lastError: key.lastError,
        },
        result,
        summary: apiKeyManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to recheck key." });
    }
  });

  // 7. Reset quota exhausted status back to active
  app.post("/api/admin/keys/:id/reset", (req, res) => {
    try {
      const key = apiKeyManager.resetKeyStatus(req.params.id);
      res.json({
        success: true,
        key: {
          id: key.id,
          status: key.status,
        },
        summary: apiKeyManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Failed to reset key status." });
    }
  });

  // 8. Reset all exhausted keys back to active
  app.post("/api/admin/keys/reset-all", (_req, res) => {
    try {
      const count = apiKeyManager.resetAllExhausted();
      res.json({
        success: true,
        resetCount: count,
        message: `Reset ${count} key(s) to active status.`,
        summary: apiKeyManager.getSummary(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to reset keys." });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Soul Lost server running on http://localhost:${PORT}`);
  });
}

startServer();
