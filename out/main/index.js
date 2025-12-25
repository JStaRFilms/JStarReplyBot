"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const dotenv = require("dotenv");
const path$1 = require("path");
const electron = require("electron");
require("node:fs");
const promises = require("node:fs/promises");
const path = require("node:path");
const node_url = require("node:url");
const zod = require("zod");
const uuid = require("uuid");
const promises$1 = require("fs/promises");
const fs = require("fs");
const generativeAi = require("@google/generative-ai");
const whatsappWeb_js = require("whatsapp-web.js");
const qrcode = require("qrcode");
const groq$1 = require("@ai-sdk/groq");
const ai = require("ai");
const google$1 = require("@ai-sdk/google");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const qrcode__namespace = /* @__PURE__ */ _interopNamespaceDefault(qrcode);
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({
        openAtLogin: auto,
        path: process.execPath
      });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window2, shortcutOptions) {
    if (!window2)
      return;
    const { webContents } = window2;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window2.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    electron.ipcMain.on("win:invoke", (event, action) => {
      const win = electron.BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
function checkArgs(adapter, defaultData2) {
  if (adapter === void 0)
    throw new Error("lowdb: missing adapter");
  if (defaultData2 === void 0)
    throw new Error("lowdb: missing default data");
}
class Low {
  adapter;
  data;
  constructor(adapter, defaultData2) {
    checkArgs(adapter, defaultData2);
    this.adapter = adapter;
    this.data = defaultData2;
  }
  async read() {
    const data = await this.adapter.read();
    if (data)
      this.data = data;
  }
  async write() {
    if (this.data)
      await this.adapter.write(this.data);
  }
  async update(fn) {
    fn(this.data);
    await this.write();
  }
}
function getTempFilename(file) {
  const f = file instanceof URL ? node_url.fileURLToPath(file) : file.toString();
  return path.join(path.dirname(f), `.${path.basename(f)}.tmp`);
}
async function retryAsyncOperation(fn, maxRetries, delayMs) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
}
class Writer {
  #filename;
  #tempFilename;
  #locked = false;
  #prev = null;
  #next = null;
  #nextPromise = null;
  #nextData = null;
  // File is locked, add data for later
  #add(data) {
    this.#nextData = data;
    this.#nextPromise ||= new Promise((resolve, reject) => {
      this.#next = [resolve, reject];
    });
    return new Promise((resolve, reject) => {
      this.#nextPromise?.then(resolve).catch(reject);
    });
  }
  // File isn't locked, write data
  async #write(data) {
    this.#locked = true;
    try {
      await promises.writeFile(this.#tempFilename, data, "utf-8");
      await retryAsyncOperation(async () => {
        await promises.rename(this.#tempFilename, this.#filename);
      }, 10, 100);
      this.#prev?.[0]();
    } catch (err) {
      if (err instanceof Error) {
        this.#prev?.[1](err);
      }
      throw err;
    } finally {
      this.#locked = false;
      this.#prev = this.#next;
      this.#next = this.#nextPromise = null;
      if (this.#nextData !== null) {
        const nextData = this.#nextData;
        this.#nextData = null;
        await this.write(nextData);
      }
    }
  }
  constructor(filename) {
    this.#filename = filename;
    this.#tempFilename = getTempFilename(filename);
  }
  async write(data) {
    return this.#locked ? this.#add(data) : this.#write(data);
  }
}
class TextFile {
  #filename;
  #writer;
  constructor(filename) {
    this.#filename = filename;
    this.#writer = new Writer(filename);
  }
  async read() {
    let data;
    try {
      data = await promises.readFile(this.#filename, "utf-8");
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return data;
  }
  write(str) {
    return this.#writer.write(str);
  }
}
class DataFile {
  #adapter;
  #parse;
  #stringify;
  constructor(filename, { parse, stringify }) {
    this.#adapter = new TextFile(filename);
    this.#parse = parse;
    this.#stringify = stringify;
  }
  async read() {
    const data = await this.#adapter.read();
    if (data === null) {
      return null;
    } else {
      return this.#parse(data);
    }
  }
  write(obj) {
    return this.#adapter.write(this.#stringify(obj));
  }
}
class JSONFile extends DataFile {
  constructor(filename) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data) => JSON.stringify(data, null, 2)
    });
  }
}
const SettingsSchema = zod.z.object({
  draftMode: zod.z.boolean().default(true),
  ignoreGroups: zod.z.boolean().default(true),
  ignoreStatuses: zod.z.boolean().default(true),
  unsavedContactsOnly: zod.z.boolean().default(false),
  humanHandoverEnabled: zod.z.boolean().default(true),
  safeModeEnabled: zod.z.boolean().default(true),
  minDelay: zod.z.number().min(3).max(30).default(5),
  maxDelay: zod.z.number().min(5).max(60).default(15),
  systemPrompt: zod.z.string().default(
    "You are JStar, a helpful support assistant for [Business Name]. Be polite, concise, and professional. Use emojis sparingly."
  ),
  licenseKey: zod.z.string().optional(),
  blacklist: zod.z.array(zod.z.string()).default([]),
  whitelist: zod.z.array(zod.z.string()).default([]),
  businessProfile: zod.z.object({
    name: zod.z.string().default(""),
    industry: zod.z.string().default(""),
    targetAudience: zod.z.string().default(""),
    tone: zod.z.enum(["professional", "friendly", "enthusiastic", "formal"]).default("professional"),
    description: zod.z.string().default("")
  }).default({}),
  botName: zod.z.string().default("JStar"),
  currency: zod.z.string().default("₦"),
  licenseStatus: zod.z.enum(["active", "expired", "invalid", "trial"]).default("trial"),
  licensePlan: zod.z.string().default("free"),
  // New Features
  voiceEnabled: zod.z.boolean().default(false),
  visionEnabled: zod.z.boolean().default(false),
  personas: zod.z.array(zod.z.object({
    id: zod.z.string(),
    name: zod.z.string(),
    description: zod.z.string(),
    systemPrompt: zod.z.string(),
    tone: zod.z.enum(["professional", "friendly", "enthusiastic", "formal", "custom"])
  })).default([]),
  activePersonaId: zod.z.string().optional()
});
const IPC_CHANNELS = {
  // Bot control
  START_BOT: "bot:start",
  STOP_BOT: "bot:stop",
  GET_STATUS: "bot:status",
  // QR Auth
  GET_QR: "auth:get-qr",
  ON_QR: "auth:on-qr",
  ON_READY: "auth:on-ready",
  ON_DISCONNECTED: "auth:on-disconnected",
  // Settings
  GET_SETTINGS: "settings:get",
  SAVE_SETTINGS: "settings:save",
  // Knowledge Base
  UPLOAD_DOCUMENT: "kb:upload",
  DELETE_DOCUMENT: "kb:delete",
  GET_DOCUMENTS: "kb:get-all",
  REINDEX_DOCUMENT: "kb:reindex",
  // Drafts
  GET_DRAFTS: "drafts:get-all",
  SEND_DRAFT: "drafts:send",
  DISCARD_DRAFT: "drafts:discard",
  EDIT_DRAFT: "drafts:edit",
  ON_NEW_DRAFT: "drafts:on-new",
  // License
  VALIDATE_LICENSE: "license:validate",
  GET_LICENSE_STATUS: "license:status",
  // Logs
  ON_LOG: "logs:on-log",
  GET_LOGS: "logs:get-all",
  EXPORT_LOGS: "logs:export",
  // Stats
  GET_STATS: "stats:get",
  ON_STATS_UPDATE: "stats:on-update",
  // Activity
  ON_ACTIVITY: "activity:on-new",
  // Catalog
  GET_CATALOG: "catalog:get-all",
  ADD_PRODUCT: "catalog:add",
  UPDATE_PRODUCT: "catalog:update",
  DELETE_PRODUCT: "catalog:delete",
  // System
  SEED_DB: "system:seed-db",
  // Smart Queue
  ON_QUEUE_UPDATE: "queue:on-update",
  // Active buffers list changed
  ON_QUEUE_PROCESSED: "queue:on-processed"
  // A batch was successfully aggregated
};
const SEED_PROFILE = {
  name: "James's Bistro & Motors",
  industry: "Hybrid Hospitality & Automotive",
  targetAudience: "Hungry drivers and people who need a ride to dinner",
  tone: "friendly",
  description: "We solve two problems: Empty stomachs and walking. Get a delicious meal while you wait for your paperwork. The only place where you can buy a Benz and a bowl of Pepper Soup at the same time."
};
const SEED_CATALOG = [
  // === FOOD ===
  {
    name: "Smoky Jollof Rice (Basmati)",
    description: "Party style jollof rice with fried plantain and peppered turkey. The smoke will wake your ancestors.",
    price: 4500,
    inStock: true,
    tags: ["food", "rice", "lunch"]
  },
  {
    name: "Eba & Egusi Soup (Assorted)",
    description: "Yellow garri with rich egusi soup containing shaki, beef, and dry fish. Finger licking goodness.",
    price: 3500,
    inStock: true,
    tags: ["food", "swallow", "local"]
  },
  {
    name: "Asun (Spicy Goat Meat)",
    description: "Peppered goat meat chopped into bite-sized pieces. Warning: Very spicy.",
    price: 5e3,
    inStock: true,
    tags: ["food", "sides", "spicy"]
  },
  {
    name: "CWAY Water Dispenser refill",
    description: "19L Refill bottle. Cold water for the hot weather.",
    price: 1500,
    inStock: true,
    tags: ["drinks", "water"]
  },
  // === CARS ===
  {
    name: "Toyota Corolla 2010 (Bank Manager Spec)",
    description: "Clean title, Lagos cleared. Ice cold AC, nothing to fix. Buy and drive.",
    price: 45e5,
    inStock: true,
    tags: ["cars", "sedan", "toyota"]
  },
  {
    name: "Lexus RX350 2017 (Full Option)",
    description: "Panoramic roof, leather seats, reverse camera. Low mileage. Tokunbo standard.",
    price: 28e6,
    inStock: true,
    tags: ["cars", "suv", "luxury"]
  },
  {
    name: "Mercedes Benz C300 2016",
    description: "Foreign used, accident free. Black on black interior. Pop and bang kit included (optional).",
    price: 22e6,
    inStock: false,
    tags: ["cars", "sedan", "luxury"]
  }
];
function generateSeedData() {
  const catalog = SEED_CATALOG.map((item) => ({
    ...item,
    id: uuid.v4(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }));
  return {
    catalog,
    profile: SEED_PROFILE,
    settings: {
      botName: "JStar",
      currency: "₦"
    }
  };
}
const defaultData = {
  settings: SettingsSchema.parse({}),
  stats: {
    messagesSent: 0,
    timeSavedMinutes: 0,
    leadsCaptured: 0
  },
  documents: [],
  catalog: [],
  drafts: [],
  messageContexts: {}
};
let db$1 = null;
async function initDatabase() {
  const userDataPath = electron.app.getPath("userData");
  const dbPath = path$1.join(userDataPath, "db.json");
  const adapter = new JSONFile(dbPath);
  db$1 = new Low(adapter, defaultData);
  await db$1.read();
  db$1.data = { ...defaultData, ...db$1.data };
  await db$1.write();
}
function getDb() {
  if (!db$1) throw new Error("Database not initialized");
  return db$1;
}
async function getSettings() {
  const db2 = getDb();
  await db2.read();
  return db2.data.settings;
}
async function saveSettings(settings) {
  const db2 = getDb();
  await db2.read();
  const merged = { ...db2.data.settings, ...settings };
  const validated = SettingsSchema.parse(merged);
  db2.data.settings = validated;
  await db2.write();
  return db2.data.settings;
}
async function getStats() {
  const db2 = getDb();
  await db2.read();
  return db2.data.stats;
}
async function incrementStats(updates) {
  const db2 = getDb();
  await db2.read();
  if (updates.messagesSent) {
    db2.data.stats.messagesSent += updates.messagesSent;
  }
  if (updates.timeSavedMinutes) {
    db2.data.stats.timeSavedMinutes += updates.timeSavedMinutes;
  }
  if (updates.leadsCaptured) {
    db2.data.stats.leadsCaptured += updates.leadsCaptured;
  }
  await db2.write();
  return db2.data.stats;
}
async function getDocuments() {
  const db2 = getDb();
  await db2.read();
  return db2.data.documents;
}
async function addDocument(doc) {
  const db2 = getDb();
  await db2.read();
  db2.data.documents.push(doc);
  await db2.write();
}
async function removeDocument(id) {
  const db2 = getDb();
  await db2.read();
  db2.data.documents = db2.data.documents.filter((d) => d.id !== id);
  await db2.write();
}
async function getDrafts() {
  const db2 = getDb();
  await db2.read();
  return db2.data.drafts || [];
}
async function addDraft(draft) {
  const db2 = getDb();
  await db2.read();
  db2.data.drafts.push(draft);
  await db2.write();
}
async function removeDraft(id) {
  const db2 = getDb();
  await db2.read();
  db2.data.drafts = db2.data.drafts.filter((d) => d.id !== id);
  await db2.write();
}
async function updateDraft(id, updates) {
  const db2 = getDb();
  await db2.read();
  const idx = db2.data.drafts.findIndex((d) => d.id === id);
  if (idx !== -1) {
    db2.data.drafts[idx] = { ...db2.data.drafts[idx], ...updates };
    await db2.write();
  }
}
async function getCatalog() {
  const db2 = getDb();
  await db2.read();
  return db2.data.catalog || [];
}
async function addCatalogItem(item) {
  const db2 = getDb();
  await db2.read();
  if (!db2.data.catalog) db2.data.catalog = [];
  db2.data.catalog.push(item);
  await db2.write();
}
async function updateCatalogItem(id, updates) {
  const db2 = getDb();
  await db2.read();
  if (!db2.data.catalog) return;
  const idx = db2.data.catalog.findIndex((i) => i.id === id);
  if (idx !== -1) {
    db2.data.catalog[idx] = { ...db2.data.catalog[idx], ...updates };
    await db2.write();
  }
}
async function deleteCatalogItem$1(id) {
  const db2 = getDb();
  await db2.read();
  if (!db2.data.catalog) return;
  db2.data.catalog = db2.data.catalog.filter((i) => i.id !== id);
  await db2.write();
}
async function seedDatabase() {
  const db2 = getDb();
  await db2.read();
  const { catalog, profile, settings } = generateSeedData();
  db2.data.catalog = catalog;
  db2.data.settings = {
    ...db2.data.settings,
    ...settings,
    // Apply botName and currency
    businessProfile: {
      ...db2.data.settings.businessProfile,
      ...profile
    }
  };
  await db2.write();
}
async function saveMessageContext(messageId, description) {
  const db2 = getDb();
  await db2.read();
  if (!db2.data.messageContexts) db2.data.messageContexts = {};
  db2.data.messageContexts[messageId] = description;
  await db2.write();
}
async function getMessageContext(messageId) {
  const db2 = getDb();
  await db2.read();
  return db2.data.messageContexts?.[messageId];
}
const db$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addCatalogItem,
  addDocument,
  addDraft,
  deleteCatalogItem: deleteCatalogItem$1,
  getCatalog,
  getDb,
  getDocuments,
  getDrafts,
  getMessageContext,
  getSettings,
  getStats,
  incrementStats,
  initDatabase,
  removeDocument,
  removeDraft,
  saveMessageContext,
  saveSettings,
  seedDatabase,
  updateCatalogItem,
  updateDraft
}, Symbol.toStringTag, { value: "Module" }));
const logs = [];
const MAX_LOGS = 1e3;
function log(level, message) {
  const entry = {
    timestamp: Date.now(),
    level,
    message
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  const prefix = `[${new Date(entry.timestamp).toLocaleTimeString()}] ${level}`;
  console.log(`${prefix}: ${message}`);
  const windows = electron.BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    win.webContents.send(IPC_CHANNELS.ON_LOG, entry);
  });
}
function getLogs() {
  return [...logs];
}
function exportLogs() {
  return logs.map((entry) => {
    const time = new Date(entry.timestamp).toISOString();
    return `[${time}] ${entry.level}: ${entry.message}`;
  }).join("\n");
}
const DEFAULT_EMBEDDING_MODEL = "text-embedding-004";
let lancedb = null;
let db = null;
let table = null;
let genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    if (!apiKey) {
      const error = "Gemini API key is required. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local";
      log("ERROR", error);
      throw new Error(error);
    }
    log("INFO", "Gemini API key loaded successfully");
    genAI = new generativeAi.GoogleGenerativeAI(apiKey);
  }
  return genAI;
}
async function initLanceDB() {
  if (db) return;
  try {
    lancedb = await import("@lancedb/lancedb");
    const userDataPath = electron.app.getPath("userData");
    const vectorsPath = path$1.join(userDataPath, "vectors");
    db = await lancedb.connect(vectorsPath);
    try {
      table = await db.openTable("knowledge");
    } catch {
      log("INFO", "Knowledge table will be created on first document");
    }
    log("INFO", "LanceDB initialized");
  } catch (error) {
    log("ERROR", `Failed to initialize LanceDB: ${error}`);
  }
}
async function getEmbedding(text) {
  if (!text || text.trim().length === 0) {
    log("WARN", "Skipping embedding for empty text");
    return [];
  }
  const { getSettings: getSettings2 } = await Promise.resolve().then(() => db$2);
  const settings = await getSettings2();
  if (settings.licenseStatus === "active" && settings.licenseKey) {
    try {
      const baseUrl = process.env.GATEKEEPER_URL || "http://127.0.0.1:3000/api";
      const cleanBase = baseUrl.replace(/\/chat$/, "");
      const GATEKEEPER_EMBED_URL = `${cleanBase}/embed`;
      const response = await fetch(GATEKEEPER_EMBED_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.licenseKey}`
        },
        body: JSON.stringify({ value: text })
      });
      if (response.ok) {
        const data = await response.json();
        return data.embedding;
      }
      log("WARN", `Gatekeeper embed failed (${response.status}), falling back to local key`);
    } catch (error) {
      log("ERROR", `Gatekeeper embed error: ${error}`);
    }
  }
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
  const model = getGenAI().getGenerativeModel({ model: embeddingModel });
  const result = await model.embedContent(text);
  return result.embedding.values;
}
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start < 0) start = 0;
    if (end === text.length) break;
  }
  return chunks;
}
async function indexDocument(filePath, fileName, fileType) {
  await initLanceDB();
  try {
    log("INFO", `Indexing document: ${fileName}`);
    let content;
    if (fileType === "pdf") {
      const pdfParse = await import("pdf-parse");
      const buffer = await promises$1.readFile(filePath);
      const pdf = await pdfParse.default(buffer);
      content = pdf.text;
    } else {
      content = await promises$1.readFile(filePath, "utf-8");
    }
    const chunks = chunkText(content);
    log("INFO", `Split into ${chunks.length} chunks`);
    const documentId = `doc_${Date.now()}`;
    const records = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText2 = chunks[i];
      if (!chunkText2) continue;
      const vector = await getEmbedding(chunkText2);
      records.push({
        id: `${documentId}_chunk_${i}`,
        text: chunkText2,
        vector,
        documentId
      });
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    if (!table && db) {
      table = await db.createTable("knowledge", records);
    } else if (table) {
      await table.add(records);
    }
    const doc = {
      id: documentId,
      name: fileName,
      type: fileType,
      sizeBytes: content.length,
      vectorCount: chunks.length,
      indexedAt: Date.now(),
      filePath
      // Store for reindexing
    };
    await addDocument(doc);
    log("INFO", `Document indexed: ${fileName} (${chunks.length} vectors)`);
    return doc;
  } catch (error) {
    log("ERROR", `Failed to index document: ${error}`);
    return null;
  }
}
async function indexCatalogItem(item) {
  await initLanceDB();
  try {
    log("INFO", `Indexing product: ${item.name}`);
    const text = `Product: ${item.name}
Price: $${item.price}
Description: ${item.description}
Tags: ${item.tags.join(", ")}
${item.inStock ? "In Stock" : "Out of Stock"}`;
    const embedding = await getEmbedding(text);
    const record = {
      id: `prod_${item.id}`,
      text,
      vector: embedding,
      documentId: `prod_${item.id}`
      // Reuse documentId field for product ID
    };
    if (!table && db) {
      table = await db.createTable("knowledge", [record]);
    } else if (table) {
      await deleteCatalogItem(item.id);
      await table.add([record]);
    }
    log("INFO", `Product indexed: ${item.name}`);
    return true;
  } catch (error) {
    log("ERROR", `Failed to index product: ${error}`);
    return false;
  }
}
async function deleteCatalogItem(id) {
  await initLanceDB();
  if (!table) return false;
  try {
    await table.delete(`"documentId" = 'prod_${id}'`);
    return true;
  } catch (error) {
    log("ERROR", `Failed to delete product vectors: ${error}`);
    return false;
  }
}
async function deleteDocument(documentId) {
  await initLanceDB();
  try {
    if (table) {
      await table.delete(`"documentId" = '${documentId}'`);
    }
    await removeDocument(documentId);
    log("INFO", `Document deleted: ${documentId}`);
    return true;
  } catch (error) {
    log("ERROR", `Failed to delete document: ${error}`);
    return false;
  }
}
async function retrieveContext(query, topK = 3) {
  await initLanceDB();
  if (!table) {
    return [];
  }
  try {
    const queryVector = await getEmbedding(query);
    const results = await table.vectorSearch(queryVector).limit(topK).toArray();
    return results.map((r) => r.text);
  } catch (error) {
    log("ERROR", `Failed to retrieve context: ${error}`);
    return [];
  }
}
async function reindexDocument(documentId) {
  const docs = await getDocuments();
  const doc = docs.find((d) => d.id === documentId);
  if (!doc) {
    log("ERROR", `Document not found: ${documentId}`);
    return false;
  }
  if (!doc.filePath) {
    log("ERROR", `Document ${documentId} is missing filePath, cannot reindex`);
    return false;
  }
  if (!fs.existsSync(doc.filePath)) {
    log("ERROR", `Source file no longer exists: ${doc.filePath}`);
    return false;
  }
  try {
    await deleteDocument(documentId);
    const newDoc = await indexDocument(doc.filePath, doc.name, doc.type);
    if (newDoc) {
      log("INFO", `Document reindexed: ${doc.name}`);
      return true;
    }
    return false;
  } catch (error) {
    log("ERROR", `Failed to reindex document: ${error}`);
    return false;
  }
}
const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";
async function validateLicenseKey(licenseKey) {
  try {
    log("INFO", "Validating license key...");
    const devKey = process.env.DEV_LICENSE_KEY;
    if (process.env.NODE_ENV === "development" && devKey && licenseKey === devKey) {
      log("WARN", "Development license key accepted (dev mode only)");
      await saveSettings({ licenseStatus: "active", licenseKey });
      return true;
    }
    const response = await fetch(`${LEMONSQUEEZY_API}/licenses/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        license_key: licenseKey
      })
    });
    if (!response.ok) {
      log("WARN", `License validation failed: HTTP ${response.status}`);
      await saveSettings({ licenseStatus: "invalid" });
      return false;
    }
    const data = await response.json();
    if (data.valid) {
      log("INFO", "License key validated successfully");
      await saveSettings({ licenseStatus: "active", licenseKey });
      return true;
    } else {
      log("WARN", "License key is invalid");
      await saveSettings({ licenseStatus: "invalid" });
      return false;
    }
  } catch (error) {
    log("ERROR", `License validation error: ${error}`);
    const settings = await getSettings();
    return settings.licenseStatus === "active";
  }
}
async function getLicenseStatus() {
  const settings = await getSettings();
  return settings.licenseStatus === "active";
}
function registerIpcHandlers(whatsappClient) {
  electron.ipcMain.handle(IPC_CHANNELS.START_BOT, async () => {
    try {
      await whatsappClient.start();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.STOP_BOT, async () => {
    try {
      await whatsappClient.stop();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_STATUS, () => {
    return {
      success: true,
      data: {
        status: whatsappClient.getStatus(),
        isRunning: whatsappClient.getStatus() === "connected"
      }
    };
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_QR, () => {
    return { success: true, data: whatsappClient.getQRCode() };
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    try {
      const settings = await getSettings();
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, async (_, settings) => {
    try {
      const validated = SettingsSchema.partial().parse(settings);
      const updated = await saveSettings(validated);
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.UPLOAD_DOCUMENT, async () => {
    try {
      const result = await electron.dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
          { name: "Documents", extensions: ["pdf", "txt", "md"] }
        ]
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: "No file selected" };
      }
      const filePath = result.filePaths[0];
      const fileName = filePath.split(/[/\\]/).pop() || "unknown";
      const ext = fileName.split(".").pop()?.toLowerCase();
      const doc = await indexDocument(filePath, fileName, ext);
      if (doc) {
        return { success: true, data: doc };
      }
      return { success: false, error: "Failed to index document" };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DELETE_DOCUMENT, async (_, documentId) => {
    try {
      const deleted = await deleteDocument(documentId);
      return { success: deleted };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_DOCUMENTS, async () => {
    try {
      const docs = await getDocuments();
      return { success: true, data: docs };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.REINDEX_DOCUMENT, async (_, documentId) => {
    try {
      const success = await reindexDocument(documentId);
      return { success };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_DRAFTS, async () => {
    try {
      const drafts = await whatsappClient.getDrafts();
      return { success: true, data: drafts };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.SEND_DRAFT, async (_, draftId, editedText) => {
    try {
      const sent = await whatsappClient.sendDraft(draftId, editedText);
      return { success: sent };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DISCARD_DRAFT, async (_, draftId) => {
    try {
      const discarded = await whatsappClient.discardDraft(draftId);
      return { success: discarded };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.EDIT_DRAFT, async (_, draftId, newText) => {
    try {
      const edited = await whatsappClient.editDraft(draftId, newText);
      return { success: edited };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.VALIDATE_LICENSE, async (_, licenseKey) => {
    try {
      const valid = await validateLicenseKey(licenseKey);
      return { success: true, data: valid };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_LICENSE_STATUS, async () => {
    try {
      const valid = await getLicenseStatus();
      return { success: true, data: valid };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_LOGS, () => {
    return { success: true, data: getLogs() };
  });
  electron.ipcMain.handle(IPC_CHANNELS.EXPORT_LOGS, async () => {
    try {
      const result = await electron.dialog.showSaveDialog({
        defaultPath: `jstarreplybot_logs_${Date.now()}.log`,
        filters: [{ name: "Log Files", extensions: ["log", "txt"] }]
      });
      if (result.canceled || !result.filePath) {
        return { success: false, error: "No file selected" };
      }
      const { writeFile } = await import("fs/promises");
      await writeFile(result.filePath, exportLogs());
      return { success: true, data: result.filePath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  console.log("Registering Catalog handlers for:", IPC_CHANNELS.GET_CATALOG, IPC_CHANNELS.ADD_PRODUCT);
  electron.ipcMain.handle(IPC_CHANNELS.GET_CATALOG, async () => {
    try {
      const catalog = await getCatalog();
      return { success: true, data: catalog };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.ADD_PRODUCT, async (_, item) => {
    try {
      await addCatalogItem(item);
      indexCatalogItem(item).catch(console.error);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.UPDATE_PRODUCT, async (_, { id, updates }) => {
    try {
      await updateCatalogItem(id, updates);
      const shouldReindex = updates.name || updates.description || updates.price || updates.tags;
      if (shouldReindex) {
        const catalog = await getCatalog();
        const newItem = catalog.find((i) => i.id === id);
        if (newItem) {
          indexCatalogItem(newItem).catch(console.error);
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DELETE_PRODUCT, async (_, id) => {
    try {
      await deleteCatalogItem$1(id);
      await deleteCatalogItem(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.GET_STATS, async () => {
    try {
      const stats = await getStats();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.SEED_DB, async () => {
    try {
      await seedDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
let groq = null;
function getGroq() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY || "";
    if (!apiKey) {
      log("WARN", "No GROQ_API_KEY found in .env.local");
    } else {
      log("INFO", `Groq API key loaded (${apiKey.substring(0, 8)}...)`);
    }
    groq = groq$1.createGroq({ apiKey });
  }
  return groq;
}
async function generateAIReply(userMessage, systemPrompt, history = [], multimodalContext) {
  try {
    const context = await retrieveContext(userMessage);
    const settings = await getSettings();
    const { botName, currency, licenseKey, licenseStatus } = settings;
    const profile = settings.businessProfile;
    const catalog = await getCatalog();
    const catalogBlock = catalog.length > 0 ? `

--- PRODUCT CATALOG ---
${catalog.map((c) => `- ${c.name} (${currency}${c.price.toLocaleString()}): ${c.inStock ? "In Stock" : "Out of Stock"}`).join("\n")}
--- END CATALOG ---
` : "";
    const contextBlock = context.length > 0 ? `

--- BUSINESS KNOWLEDGE ---
${context.join("\n\n")}
--- END KNOWLEDGE ---
` : "";
    const profileBlock = `
You are ${botName}, a helpful AI assistant working for ${profile.name || "our business"}.
Industry: ${profile.industry || "General"}
Target Audience: ${profile.targetAudience}
Tone: ${profile.tone}
${profile.description}`;
    const historyBlock = history.length > 0 ? `

--- CONVERSATION HISTORY ---
${history.map((m) => `${m.role === "user" ? "User" : "You"}: ${m.content}`).join("\n")}
--- END HISTORY ---
` : "";
    const multimodalBlock = multimodalContext ? `

--- MEDIA CONTEXT ---
The user sent a media file with the following analysis:
${multimodalContext}
--- END MEDIA CONTEXT ---
` : "";
    const fullSystemPrompt = `${systemPrompt}
${profileBlock}
${catalogBlock}
${contextBlock}
${historyBlock}
${multimodalBlock}

IMPORTANT INSTRUCTIONS:
1. Your name is ${botName}. You are NOT the business owner, you work for them.
2. ALWAYS use ${currency} for currency (e.g. ${currency}1,000). Never use '$' unless explicitly asked.
3. STRICTLY ADHERE TO THE PRODUCT CATALOG. Do not invent products or sell items mentioned in the generic description unless they explicitly appear in the CATALOG list.
4. If a user asks for a product not in the catalog, politely say you don't have it and offer an alternative from the catalog.
5. Keep responses concise and friendly (under 200 characters if possible)
6. If you detect the user is asking about a specific product, mention it naturally
7. If the user seems frustrated (sentiment: high), be extra empathetic
8. Never admit you are an AI unless directly asked
9. Use natural, conversational language
10. Match the specified Tone (${profile.tone}) in your writing style.
11. If MEDIA CONTEXT is provided, TREAT IT AS DIRECT USER INPUT. Do NOT say "I see you sent an image" or "According to the analysis". React naturally. (e.g., If the image contains a "Merry Christmas" flyer, reply "Merry Christmas!"; if it shows a product, answer questions about it).

Analyze the user's message for:
- Sentiment level (low/medium/high frustration)
- Product intent (what product/service they're asking about)

Respond with a helpful reply.`;
    let textResponse = "";
    if (licenseStatus === "active" && licenseKey) {
      log("INFO", "Using Gatekeeper (Licensed) via fetch");
      const GATEKEEPER_URL = process.env.GATEKEEPER_URL || "http://127.0.0.1:3000/api";
      try {
        const response = await fetch(`${GATEKEEPER_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${licenseKey}`
          },
          body: JSON.stringify({
            model: "moonshotai/kimi-k2-instruct-0905",
            messages: [
              { role: "system", content: fullSystemPrompt },
              { role: "user", content: userMessage }
            ]
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          log("ERROR", `Gatekeeper request failed: ${response.status} - ${errorText}`);
          throw new Error(`Gatekeeper Error: ${response.status}`);
        }
        const data = await response.json();
        textResponse = data.text || "";
      } catch (gkError) {
        log("ERROR", `Gatekeeper call failed: ${gkError}. Falling back to local Groq.`);
        const result = await ai.generateText({
          model: getGroq()("llama-3.3-70b-versatile"),
          system: fullSystemPrompt,
          messages: [{ role: "user", content: userMessage }]
        });
        textResponse = result.text;
      }
    } else {
      log("INFO", "Using local Groq API (Dev/Trial/Fallback)");
      const result = await ai.generateText({
        model: getGroq()("llama-3.3-70b-versatile"),
        system: fullSystemPrompt,
        messages: [{ role: "user", content: userMessage }]
      });
      textResponse = result.text;
    }
    const sentiment = detectSentiment(userMessage);
    const productIntent = detectProductIntent(userMessage);
    log("AI", `Generated reply (sentiment: ${sentiment}, product: ${productIntent || "none"})`);
    return {
      text: textResponse,
      sentiment,
      productIntent
    };
  } catch (error) {
    log("ERROR", `AI generation failed: ${error}`);
    return null;
  }
}
function detectSentiment(text) {
  const lowerText = text.toLowerCase();
  const highIndicators = ["urgent", "angry", "frustrated", "terrible", "worst", "hate", "ridiculous", "unacceptable", "immediately", "!!!"];
  const mediumIndicators = ["disappointed", "confused", "waiting", "problem", "issue", "wrong", "late", "delayed"];
  if (highIndicators.some((indicator) => lowerText.includes(indicator))) {
    return "high";
  }
  if (mediumIndicators.some((indicator) => lowerText.includes(indicator))) {
    return "medium";
  }
  return "low";
}
function detectProductIntent(text) {
  const productPatterns = [
    /(?:about|buy|purchase|order|price of|cost of|interested in)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/i,
    /(?:your|the)\s+(\w+(?:\s+\w+)?)\s+(?:product|service|plan|package)/i
  ];
  for (const pattern of productPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return void 0;
}
let google = null;
function getGoogle() {
  if (!google) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      log("WARN", "No GEMINI_API_KEY found (Local Dev). Multimodal features may fail if not licensed.");
    }
    google = google$1.createGoogleGenerativeAI({ apiKey });
  }
  return google;
}
async function analyzeMedia(mode, base64Data, mimeType) {
  try {
    const settings = await getSettings();
    const { licenseKey, licenseStatus } = settings;
    const cleanMime = (mimeType.split(";")[0] || mimeType).trim();
    let prompt = "";
    if (mode === "audio") {
      prompt = "Transcribe this audio message exactly as spoken. If it contains a question or request, summarize the intent at the end in brackets [Intent: ...].";
    } else if (mode === "video") {
      prompt = "Describe this video. If there is speech, transcribe it. If there is visual action, describe it naturally.";
    } else {
      prompt = 'Describe the content of this image naturally. If there is text, transcribe it. If there are products, list them. Do not describe the image as an "file" or "attachment", just describe what is IN it.';
    }
    const content = [{ type: "text", text: prompt }];
    if (mode === "image") {
      content.push({
        type: "image",
        image: base64Data
      });
    } else {
      content.push({
        type: "file",
        data: base64Data,
        mimeType: cleanMime
      });
    }
    log("DEBUG", `[Multimodal] Sending payload: ${cleanMime} (${base64Data.length} chars)`);
    let output = "";
    if (licenseStatus === "active" && licenseKey) {
      log("INFO", "[Multimodal] Using Gatekeeper (Licensed) via fetch");
      const GATEKEEPER_URL = process.env.GATEKEEPER_URL || "http://127.0.0.1:3000/api";
      try {
        const response = await fetch(`${GATEKEEPER_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${licenseKey}`
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash-lite",
            messages: [
              { role: "user", content }
            ]
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          log("ERROR", `[Multimodal] Gatekeeper request failed: ${response.status} - ${errorText}`);
          throw new Error(`Gatekeeper Error: ${response.status}`);
        }
        const data = await response.json();
        output = data.text || "";
      } catch (gkError) {
        log("ERROR", `[Multimodal] Gatekeeper call failed: ${gkError}. Falling back to local Google.`);
        const googleProvider = getGoogle();
        if (!googleProvider) {
          log("WARN", "Google AI provider not initialized for local fallback");
          return null;
        }
        const result = await ai.generateText({
          model: googleProvider("gemini-2.5-flash-lite"),
          messages: [{ role: "user", content }]
        });
        output = result.text;
      }
    } else {
      const googleProvider = getGoogle();
      if (!googleProvider) {
        log("WARN", "Google AI provider not initialized for local fallback");
        return null;
      }
      const result = await ai.generateText({
        model: googleProvider("gemini-2.5-flash-lite"),
        messages: [{ role: "user", content }]
      });
      output = result.text;
    }
    log("AI", `[Multimodal] ${mode} analysis: ${output.substring(0, 50)}...`);
    return output;
  } catch (error) {
    log("ERROR", `Multimodal analysis failed (${mode}): ${error}`);
    return null;
  }
}
class SmartQueueService {
  buffers = /* @__PURE__ */ new Map();
  // 10 seconds debounce - allows user to type multiple valid messages
  DEBOUNCE_MS = 1e4;
  broadcast;
  constructor(broadcast) {
    this.broadcast = broadcast;
  }
  setBroadcast(fn) {
    this.broadcast = fn;
  }
  /**
   * Enqueue a message for a specific contact.
   * Starts or resets the debounce timer.
   */
  enqueue(contactId, message, onProcess) {
    const existing = this.buffers.get(contactId);
    const now = Date.now();
    const contactName = message._data?.notifyName || contactId.replace("@c.us", "");
    if (existing) {
      clearTimeout(existing.timer);
      existing.messages.push(message);
      log("DEBUG", `[SmartQueue] Buffering message for ${contactName} (${existing.messages.length} pending)`);
      existing.timer = setTimeout(() => {
        this.processBuffer(contactId, onProcess);
      }, this.DEBOUNCE_MS);
    } else {
      log("DEBUG", `[SmartQueue] Starting new buffer for ${contactName}`);
      const timer = setTimeout(() => {
        this.processBuffer(contactId, onProcess);
      }, this.DEBOUNCE_MS);
      this.buffers.set(contactId, {
        timer,
        messages: [message],
        startTime: now
      });
    }
    this.emitQueueUpdate();
  }
  /**
   * Remove a specific message from the queue (e.g. if it was revoked/deleted)
   */
  removeMessage(contactId, messageId) {
    const item = this.buffers.get(contactId);
    if (!item) return;
    const originalCount = item.messages.length;
    item.messages = item.messages.filter((m) => m.id._serialized !== messageId);
    if (item.messages.length !== originalCount) {
      log("INFO", `[SmartQueue] Removed revoked message ${messageId} from ${contactId} buffer`);
      if (item.messages.length === 0) {
        clearTimeout(item.timer);
        this.buffers.delete(contactId);
        log("DEBUG", `[SmartQueue] Empty buffer for ${contactId} removed`);
      }
      this.emitQueueUpdate();
    }
  }
  async processBuffer(contactId, callback) {
    const item = this.buffers.get(contactId);
    if (!item) return;
    this.buffers.delete(contactId);
    this.emitQueueUpdate();
    log("INFO", `[SmartQueue] Processing batch of ${item.messages.length} messages for ${contactId}`);
    try {
      const result = await callback(item.messages);
      if (this.broadcast) {
        const event = {
          contactId,
          contactName: item.messages[0]._data?.notifyName || contactId,
          messageCount: item.messages.length,
          aggregatedPrompt: item.messages.map((m) => m.body).join(" | "),
          costSaved: (item.messages.length - 1) * 0.05,
          timestamp: Date.now(),
          status: result.status,
          error: result.error
        };
        this.broadcast("queue:on-processed", event);
      }
    } catch (error) {
      log("ERROR", `[SmartQueue] Failed to process batch: ${error}`);
      if (this.broadcast) {
        const event = {
          contactId,
          contactName: item.messages[0]._data?.notifyName || contactId,
          messageCount: item.messages.length,
          aggregatedPrompt: item.messages.map((m) => m.body).join(" | "),
          costSaved: 0,
          timestamp: Date.now(),
          status: "failed",
          error: String(error)
        };
        this.broadcast("queue:on-processed", event);
      }
    }
  }
  emitQueueUpdate() {
    if (!this.broadcast) return;
    const items = Array.from(this.buffers.entries()).map(([id, item]) => {
      const lastMsg = item.messages[item.messages.length - 1];
      if (!lastMsg) return null;
      const bufferItem = {
        contactId: id,
        contactName: lastMsg._data?.notifyName || id.replace("@c.us", ""),
        messageCount: item.messages.length,
        startTime: item.startTime,
        expiresAt: Date.now() + this.DEBOUNCE_MS,
        lastMessagePreview: lastMsg.body.substring(0, 30)
      };
      return bufferItem;
    }).filter((i) => i !== null);
    this.broadcast("queue:on-update", items);
  }
}
class WhatsAppClient {
  client = null;
  status = "disconnected";
  qrCodeDataUrl = null;
  isRunning = false;
  queueService;
  constructor() {
    this.queueService = new SmartQueueService((channel, data) => this.broadcastToRenderer(channel, data));
    this.initClient();
  }
  initClient() {
    const userDataPath = electron.app.getPath("userData");
    const authPath = path$1.join(userDataPath, ".wwebjs_auth");
    this.client = new whatsappWeb_js.Client({
      authStrategy: new whatsappWeb_js.LocalAuth({ dataPath: authPath }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--disable-gpu"
        ]
      }
    });
    this.setupEventHandlers();
  }
  setupEventHandlers() {
    if (!this.client) return;
    this.client.on("qr", async (qr) => {
      log("INFO", "QR Code received, waiting for scan...");
      this.status = "qr_ready";
      this.qrCodeDataUrl = await qrcode__namespace.toDataURL(qr);
      this.broadcastToRenderer(IPC_CHANNELS.ON_QR, this.qrCodeDataUrl);
    });
    this.client.on("ready", async () => {
      log("INFO", "WhatsApp client is ready!");
      this.status = "connected";
      this.qrCodeDataUrl = null;
      this.broadcastToRenderer(IPC_CHANNELS.ON_READY, true);
      try {
        const page = this.client.pupPage;
        if (page) {
          await page.evaluate(() => {
            const windowAny = window;
            if (!windowAny.Store) windowAny.Store = {};
            if (!windowAny.Store.ContactMethods) windowAny.Store.ContactMethods = {};
            if (!windowAny.Store.ContactMethods.getIsMyContact) {
              windowAny.Store.ContactMethods.getIsMyContact = () => false;
              console.log("[JStar] Injected getIsMyContact polyfill");
            }
          });
          log("INFO", "Applied contact lookup patch successfully");
        }
      } catch (patchError) {
        log("WARN", `Failed to apply contact lookup patch: ${patchError}`);
      }
    });
    this.client.on("authenticated", () => {
      log("INFO", "WhatsApp authenticated successfully");
    });
    this.client.on("auth_failure", (msg) => {
      log("ERROR", `Authentication failed: ${msg}`);
      this.status = "disconnected";
    });
    this.client.on("disconnected", (reason) => {
      log("WARN", `WhatsApp disconnected: ${reason}`);
      this.status = "disconnected";
      this.broadcastToRenderer(IPC_CHANNELS.ON_DISCONNECTED, reason);
    });
    this.client.on("message", async (msg) => {
      if (!this.isRunning) return;
      await this.handleIncomingMessage(msg);
    });
    this.client.on("message_revoke_everyone", async (msg) => {
      if (!this.isRunning) return;
      if (msg) {
        this.queueService.removeMessage(msg.from, msg.id._serialized);
      }
    });
  }
  async handleIncomingMessage(msg) {
    try {
      const settings = await getSettings();
      if (msg.fromMe) return;
      if (settings.ignoreGroups && msg.from.includes("@g.us")) return;
      if (settings.ignoreGroups && msg.from.includes("@g.us")) return;
      if (settings.ignoreStatuses && msg.from.includes("@broadcast") && !msg.from.includes("@newsletter")) return;
      if (msg.from.includes("@newsletter")) return;
      const ignoredTypes = ["e2e_notification", "call_log", "protocol", "gp2", "notification_template", "ciphertext", "revoked"];
      if (ignoredTypes.includes(msg.type)) return;
      let contact;
      try {
        contact = await msg.getContact();
      } catch (e) {
        log("WARN", `Contact lookup failed: ${e}`);
      }
      if (!this.shouldReply(msg, settings, contact)) {
        return;
      }
      let contactName = "Unknown";
      let contactNumber = msg.from.replace("@c.us", "");
      if (contact) {
        contactName = contact.name || contact.pushname || contact.number || contactNumber;
        contactNumber = contact.number || contactNumber;
      } else {
        const rawName = msg._data?.notifyName || msg._data?.pushname;
        contactName = rawName || contactNumber;
      }
      let multimodalContext = "";
      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          if (media) {
            const mime = media.mimetype;
            if (settings.voiceEnabled && (mime.includes("audio") || mime.includes("ogg"))) {
              log("INFO", "Processing Voice Note...");
              const analysis = await analyzeMedia("audio", media.data, mime);
              if (analysis) {
                multimodalContext = `[VOICE NOTE TRANSCRIPTION]: "${analysis}"`;
                msg.body = `(Sent a Voice Note: "${analysis}")`;
                await saveMessageContext(msg.id._serialized, analysis);
              }
            }
            if (settings.visionEnabled && (mime.includes("image") || mime.includes("sticker"))) {
              log("INFO", "Processing Image/Sticker...");
              const analysis = await analyzeMedia("image", media.data, mime);
              if (analysis) {
                multimodalContext = `[IMAGE ANALYSIS]: "${analysis}"`;
                msg.body = msg.body ? `${msg.body} 
(Sent an Image: ${analysis})` : `(Sent an Image: ${analysis})`;
                await saveMessageContext(msg.id._serialized, analysis);
              }
            }
            if (settings.visionEnabled && mime.includes("video")) {
              log("INFO", "Processing Video...");
              const analysis = await analyzeMedia("video", media.data, mime);
              if (analysis) {
                multimodalContext = `[VIDEO ANALYSIS]: "${analysis}"`;
                msg.body = msg.body ? `${msg.body} 
(Sent a Video: ${analysis})` : `(Sent a Video: ${analysis})`;
                await saveMessageContext(msg.id._serialized, analysis);
              }
            }
          }
        } catch (mediaError) {
          log("ERROR", `Failed to download/process media: ${mediaError}`);
        }
      }
      msg._multimodalContext = multimodalContext;
      this.queueService.enqueue(
        msg.from,
        msg,
        (messages) => this.processAggregatedMessages(messages, settings, contactName)
      );
    } catch (error) {
      log("ERROR", `Error handling message: ${error}`);
    }
  }
  async processAggregatedMessages(messages, settings, contactName) {
    if (messages.length === 0) return { status: "skipped" };
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return { status: "skipped" };
    const contactNumber = lastMsg.from.replace("@c.us", "");
    try {
      let chat;
      try {
        chat = await lastMsg.getChat();
      } catch (chatError) {
        log("ERROR", `Failed to get chat context: ${chatError}`);
        return { status: "failed", error: "Chat context unavailable" };
      }
      const combinedQuery = messages.map((m) => m.body).join("\n");
      const combinedMultimodal = messages.map((m) => m._multimodalContext).filter(Boolean).join("\n\n");
      log("INFO", `[SmartQueue] Processing aggregated query (${messages.length} msgs) from ${contactName}: "${combinedQuery.substring(0, 50)}..."`);
      let history = [];
      try {
        const fetchedMessages = await chat.fetchMessages({ limit: 30 });
        const currentBatchIds = new Set(messages.map((m) => m.id._serialized));
        const historyPromises = fetchedMessages.filter((m) => !currentBatchIds.has(m.id._serialized)).map(async (m) => {
          const context = await getMessageContext(m.id._serialized);
          const role = m.fromMe ? "model" : "user";
          const content = context ? `${m.body}
[Context: ${context}]` : m.body;
          return { role, content };
        });
        history = await Promise.all(historyPromises);
      } catch (histError) {
        log("WARN", `Failed to fetch history: ${histError}`);
      }
      let reply;
      try {
        reply = await generateAIReply(combinedQuery, settings.systemPrompt, history, combinedMultimodal);
      } catch (aiError) {
        const errorStr = String(aiError);
        log("ERROR", `AI Gen Failed: ${errorStr}`);
        return { status: "failed", error: errorStr.includes("402") ? "License Expired" : "AI Service Error" };
      }
      if (!reply) {
        log("WARN", "No reply generated by AI (Empty response)");
        return { status: "skipped", error: "Empty AI Response" };
      }
      const handoverRequested = settings.humanHandoverEnabled && messages.some(
        (m) => this.detectHandoverRequest(m.body)
      );
      if (handoverRequested) {
        log("INFO", `Human handover requested by ${contactName} - Force creating draft`);
      }
      if (settings.draftMode || handoverRequested) {
        const draft = {
          id: `draft_${Date.now()}`,
          chatId: chat.id._serialized,
          contactName,
          contactNumber,
          originalMessageId: lastMsg.id._serialized,
          // Link to newest message
          query: combinedQuery,
          // Store the FULL aggregated query
          proposedReply: reply.text,
          sentiment: reply.sentiment,
          isHandover: handoverRequested || false,
          createdAt: Date.now()
        };
        try {
          await addDraft(draft);
          this.broadcastToRenderer(IPC_CHANNELS.ON_NEW_DRAFT, draft);
          log("INFO", `Draft queued for approval: ${draft.id}`);
          return { status: "drafted" };
        } catch (dbError) {
          log("ERROR", `Failed to save draft to database: ${dbError}`);
          return { status: "failed", error: "Draft DB Error" };
        }
      }
      try {
        await this.sendReplyWithSafeMode(lastMsg, reply.text, settings);
        const now = /* @__PURE__ */ new Date();
        const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        this.broadcastToRenderer(IPC_CHANNELS.ON_ACTIVITY, {
          id: `activity_${Date.now()}`,
          contact: contactName,
          time: timeStr,
          query: combinedQuery,
          response: reply.text,
          timestamp: Date.now()
        });
        return { status: "sent" };
      } catch (sendError) {
        log("ERROR", `Failed to send reply: ${sendError}`);
        return { status: "failed", error: "WhatsApp Send Failed" };
      }
    } catch (error) {
      log("ERROR", `Error processing aggregated messages: ${error}`);
      return { status: "failed", error: String(error) };
    }
  }
  shouldReply(msg, settings, contact) {
    if (msg.fromMe) return false;
    const senderNumber = msg.from.replace("@c.us", "");
    if (settings.blacklist.includes(msg.from) || settings.blacklist.includes(senderNumber)) {
      log("DEBUG", `Blocked by blacklist: ${msg.from}`);
      return false;
    }
    if (settings.whitelist.includes(msg.from) || settings.whitelist.includes(senderNumber)) {
      log("DEBUG", `Allowed by whitelist: ${msg.from}`);
      return true;
    }
    if (settings.ignoreGroups && msg.from.includes("@g.us")) {
      return false;
    }
    if (settings.ignoreStatuses && msg.from.includes("@broadcast")) {
      return false;
    }
    if (settings.unsavedContactsOnly) {
      const isSaved = contact?.isMyContact || contact?.name && contact?.name !== contact?.number;
      if (isSaved) {
        log("DEBUG", `Skipping message from saved contact: ${contact?.name || msg.from}`);
        return false;
      }
    }
    return true;
  }
  detectHandoverRequest(text) {
    const keywords = ["human", "speak to a person", "real person", "agent", "support", "help me", "customer service"];
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw));
  }
  async sendReplyWithSafeMode(msg, text, settings) {
    const chat = await msg.getChat();
    const messages = this.splitMessage(text);
    for (let i = 0; i < messages.length; i++) {
      const messageText = messages[i];
      if (!messageText) continue;
      if (settings.safeModeEnabled) {
        const delay = this.randomDelay(settings.minDelay, settings.maxDelay);
        log("DEBUG", `Safe mode: waiting ${delay}ms before reply ${i + 1}/${messages.length}`);
        await this.sleep(delay);
        await chat.sendStateTyping();
        await this.sleep(Math.min(messageText.length * 30, 3e3));
      }
      if (i === 0) {
        await msg.reply(messageText);
      } else {
        await chat.sendMessage(messageText);
      }
      log("INFO", `Sent reply ${i + 1}/${messages.length}`);
    }
    try {
      await incrementStats({
        messagesSent: messages.length,
        timeSavedMinutes: 1
        // Assume 1 min saved per reply
      });
    } catch (statsError) {
      log("ERROR", `Failed to update stats: ${statsError}`);
    }
  }
  splitMessage(text) {
    const MAX_BUBBLE_LENGTH = 500;
    if (text.length <= MAX_BUBBLE_LENGTH) return [text];
    const sentences = text.split(/(?<=[.!?])\s+/);
    const messages = [];
    let current = "";
    for (const sentence of sentences) {
      const nextChunk = current ? `${current} ${sentence}` : sentence;
      if (nextChunk.length > MAX_BUBBLE_LENGTH && messages.length < 2) {
        if (current) messages.push(current.trim());
        current = sentence;
      } else {
        current = nextChunk;
      }
    }
    if (current) messages.push(current.trim());
    return messages.slice(0, 3);
  }
  randomDelay(minSec, maxSec) {
    return (Math.random() * (maxSec - minSec) + minSec) * 1e3;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  broadcastToRenderer(channel, data) {
    const windows = electron.BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      win.webContents.send(channel, data);
    });
  }
  // ============ Public API ============
  async start() {
    if (!this.client) {
      this.initClient();
    }
    log("INFO", "Starting WhatsApp client...");
    log("INFO", "Launching Chromium browser (this may take 30-60 seconds on first run)...");
    this.status = "connecting";
    try {
      await this.client?.initialize();
      this.isRunning = true;
      log("INFO", "WhatsApp client initialized successfully");
    } catch (error) {
      log("ERROR", `Failed to initialize WhatsApp client: ${error}`);
      this.status = "disconnected";
      throw error;
    }
  }
  async stop() {
    log("INFO", "Stopping WhatsApp client...");
    this.isRunning = false;
    await this.client?.destroy();
    this.client = null;
    this.status = "disconnected";
  }
  getStatus() {
    return this.status;
  }
  getQRCode() {
    return this.qrCodeDataUrl;
  }
  async getDrafts() {
    return await getDrafts();
  }
  async sendDraft(draftId, editedText) {
    const drafts = await getDrafts();
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft || !this.client) return false;
    try {
      const text = editedText || draft.proposedReply;
      let chat;
      try {
        chat = await this.client.getChatById(draft.chatId);
      } catch (chatError) {
        log("WARN", `Chat ${draft.chatId} no longer exists or is inaccessible: ${chatError}`);
        await removeDraft(draftId);
        return false;
      }
      await chat.sendMessage(text);
      const currentDrafts = await getDrafts();
      if (!currentDrafts.find((d) => d.id === draftId)) {
        log("WARN", `Draft ${draftId} was already removed by another process`);
      } else {
        await removeDraft(draftId);
      }
      try {
        await incrementStats({ messagesSent: 1, timeSavedMinutes: 1 });
      } catch (statsError) {
        log("ERROR", `Failed to update stats: ${statsError}`);
      }
      const event = {
        // using 'any' to avoid circular dep or full type import if not easy
        contactId: draft.contactNumber + "@c.us",
        contactName: draft.contactName,
        messageCount: 1,
        // approximate
        aggregatedPrompt: draft.query,
        costSaved: 0,
        timestamp: Date.now(),
        status: "sent",
        error: void 0
      };
      this.broadcastToRenderer(IPC_CHANNELS.ON_QUEUE_PROCESSED, event);
      log("INFO", `Draft ${draftId} sent successfully`);
      return true;
    } catch (error) {
      log("ERROR", `Failed to send draft: ${error}`);
      return false;
    }
  }
  async discardDraft(draftId) {
    try {
      const drafts = await getDrafts();
      if (!drafts.find((d) => d.id === draftId)) {
        log("WARN", `Draft ${draftId} not found, may have been already removed`);
        return false;
      }
      await removeDraft(draftId);
      log("INFO", `Draft ${draftId} discarded`);
      return true;
    } catch (error) {
      log("ERROR", `Failed to discard draft: ${error}`);
      return false;
    }
  }
  async editDraft(draftId, newText) {
    try {
      const drafts = await getDrafts();
      if (!drafts.find((d) => d.id === draftId)) {
        log("WARN", `Draft ${draftId} not found for editing`);
        return false;
      }
      await updateDraft(draftId, { proposedReply: newText });
      return true;
    } catch (error) {
      log("ERROR", `Failed to edit draft: ${error}`);
      return false;
    }
  }
}
dotenv.config({ path: path$1.resolve(process.cwd(), ".env.local") });
exports.mainWindow = null;
let tray = null;
exports.whatsappClient = null;
let isQuitting = false;
function createWindow() {
  exports.mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0f172a",
    icon: path$1.join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: path$1.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  exports.mainWindow.on("ready-to-show", () => {
    exports.mainWindow?.show();
  });
  exports.mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    exports.mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    exports.mainWindow.loadFile(path$1.join(__dirname, "../renderer/index.html"));
  }
  exports.mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      exports.mainWindow?.hide();
    }
  });
}
function createTray() {
  const iconPath = path$1.join(__dirname, "../../resources/icon.png");
  const icon = electron.nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new electron.Tray(icon);
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "Open JStarReplyBot",
      click: () => exports.mainWindow?.show()
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("JStarReplyBot");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => exports.mainWindow?.show());
}
electron.app.whenReady().then(async () => {
  electronApp.setAppUserModelId("com.jstar.replybot");
  electron.app.on("browser-window-created", (_, window2) => {
    optimizer.watchWindowShortcuts(window2);
  });
  await initDatabase();
  log("INFO", "Database initialized");
  exports.whatsappClient = new WhatsAppClient();
  log("INFO", "WhatsApp client initialized");
  registerIpcHandlers(exports.whatsappClient);
  log("INFO", "IPC handlers registered (v2 with Catalog)");
  createWindow();
  createTray();
  try {
    log("INFO", "Auto-starting WhatsApp client...");
    await exports.whatsappClient.start();
  } catch (error) {
    log("WARN", `Auto-start failed (may need QR scan): ${error}`);
  }
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", async () => {
  log("INFO", "Application quitting, cleaning up...");
  if (exports.whatsappClient) {
    try {
      await exports.whatsappClient.stop();
      log("INFO", "WhatsApp client stopped successfully");
    } catch (error) {
      log("ERROR", `Error stopping WhatsApp client: ${error}`);
    }
  }
});
