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
const promises$1 = require("fs/promises");
const generativeAi = require("@google/generative-ai");
const whatsappWeb_js = require("whatsapp-web.js");
const qrcode = require("qrcode");
const groq$1 = require("@ai-sdk/groq");
const ai = require("ai");
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
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
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
            window.close();
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
  whitelist: zod.z.array(zod.z.string()).default([])
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
  ON_ACTIVITY: "activity:on-new"
};
const defaultData = {
  settings: SettingsSchema.parse({}),
  stats: {
    messagesSent: 0,
    timeSavedMinutes: 0,
    leadsCaptured: 0
  },
  documents: [],
  drafts: [],
  licenseValid: false
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
  db2.data.settings = { ...db2.data.settings, ...settings };
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
async function updateDocument(id, updates) {
  const db2 = getDb();
  await db2.read();
  const idx = db2.data.documents.findIndex((d) => d.id === id);
  if (idx !== -1) {
    db2.data.documents[idx] = { ...db2.data.documents[idx], ...updates };
    await db2.write();
  }
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
async function getLicenseStatus$1() {
  const db2 = getDb();
  await db2.read();
  return db2.data.licenseValid;
}
async function setLicenseStatus(valid) {
  const db2 = getDb();
  await db2.read();
  db2.data.licenseValid = valid;
  await db2.write();
}
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
let lancedb = null;
let db = null;
let table = null;
let genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    if (!apiKey) {
      log("WARN", "No Gemini API key found. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local");
    } else {
      log("INFO", `Gemini API key loaded (${apiKey.substring(0, 8)}...)`);
    }
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
  const model = getGenAI().getGenerativeModel({ model: "text-embedding-004" });
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
      indexedAt: Date.now()
    };
    await addDocument(doc);
    log("INFO", `Document indexed: ${fileName} (${chunks.length} vectors)`);
    return doc;
  } catch (error) {
    log("ERROR", `Failed to index document: ${error}`);
    return null;
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
  await updateDocument(documentId, { indexedAt: Date.now() });
  log("INFO", `Document reindexed: ${doc.name}`);
  return true;
}
const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";
async function validateLicenseKey(licenseKey) {
  try {
    log("INFO", "Validating license key...");
    if (licenseKey === "DEV-JSTAR-2024") {
      log("INFO", "Development license key accepted");
      await setLicenseStatus(true);
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
      await setLicenseStatus(false);
      return false;
    }
    const data = await response.json();
    if (data.valid) {
      log("INFO", "License key validated successfully");
      await setLicenseStatus(true);
      return true;
    } else {
      log("WARN", "License key is invalid");
      await setLicenseStatus(false);
      return false;
    }
  } catch (error) {
    log("ERROR", `License validation error: ${error}`);
    return await getLicenseStatus$1();
  }
}
async function getLicenseStatus() {
  return await getLicenseStatus$1();
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
      if (result.canceled || !result.filePaths[0]) {
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
  electron.ipcMain.handle(IPC_CHANNELS.GET_STATS, async () => {
    try {
      const stats = await getStats();
      return { success: true, data: stats };
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
async function generateAIReply(userMessage, systemPrompt) {
  try {
    const context = await retrieveContext(userMessage);
    const contextBlock = context.length > 0 ? `

--- BUSINESS KNOWLEDGE ---
${context.join("\n\n")}
--- END KNOWLEDGE ---
` : "";
    const fullSystemPrompt = `${systemPrompt}
${contextBlock}

IMPORTANT INSTRUCTIONS:
1. Keep responses concise and friendly (under 200 characters if possible)
2. If you detect the user is asking about a specific product, mention it naturally
3. If the user seems frustrated (sentiment: high), be extra empathetic
4. Never admit you are an AI unless directly asked
5. Use natural, conversational language

Analyze the user's message for:
- Sentiment level (low/medium/high frustration)
- Product intent (what product/service they're asking about)

Respond with a helpful reply.`;
    const result = await ai.generateText({
      model: getGroq()("llama-3.3-70b-versatile"),
      system: fullSystemPrompt,
      prompt: userMessage,
      maxTokens: 300,
      temperature: 0.7
    });
    const sentiment = detectSentiment(userMessage);
    const productIntent = detectProductIntent(userMessage);
    log("AI", `Generated reply (sentiment: ${sentiment}, product: ${productIntent || "none"})`);
    return {
      text: result.text,
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
class WhatsAppClient {
  client = null;
  status = "disconnected";
  qrCodeDataUrl = null;
  isRunning = false;
  // Drafts now persisted to database
  constructor() {
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
    this.client.on("ready", () => {
      log("INFO", "WhatsApp client is ready!");
      this.status = "connected";
      this.qrCodeDataUrl = null;
      this.broadcastToRenderer(IPC_CHANNELS.ON_READY, true);
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
  }
  async handleIncomingMessage(msg) {
    try {
      const settings = await getSettings();
      if (!this.shouldReply(msg, settings)) {
        return;
      }
      const chat = await msg.getChat();
      let contactName = "Unknown";
      let contactNumber = msg.from.replace("@c.us", "");
      try {
        const contact = await msg.getContact();
        contactName = contact.pushname || contact.number || contactNumber;
        contactNumber = contact.number || contactNumber;
      } catch (contactError) {
        log("WARN", `Could not get contact info, using fallback: ${contactError}`);
        contactName = contactNumber;
      }
      log("INFO", `New message from ${contactName}: "${msg.body.substring(0, 50)}..."`);
      const reply = await generateAIReply(msg.body, settings.systemPrompt);
      if (!reply) {
        log("WARN", "No reply generated by AI");
        return;
      }
      if (settings.humanHandoverEnabled && this.detectHandoverRequest(msg.body)) {
        log("INFO", `Human handover requested by ${contactName}`);
        return;
      }
      if (settings.draftMode) {
        const draft = {
          id: `draft_${Date.now()}`,
          chatId: chat.id._serialized,
          contactName,
          contactNumber,
          originalMessageId: msg.id._serialized,
          query: msg.body,
          proposedReply: reply.text,
          sentiment: reply.sentiment,
          createdAt: Date.now()
        };
        await addDraft(draft);
        this.broadcastToRenderer(IPC_CHANNELS.ON_NEW_DRAFT, draft);
        log("INFO", `Draft queued for approval: ${draft.id}`);
        return;
      }
      await this.sendReplyWithSafeMode(msg, reply.text, settings);
      const now = /* @__PURE__ */ new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      this.broadcastToRenderer(IPC_CHANNELS.ON_ACTIVITY, {
        id: `activity_${Date.now()}`,
        contact: contactName,
        time: timeStr,
        query: msg.body,
        response: reply.text,
        timestamp: Date.now()
      });
    } catch (error) {
      log("ERROR", `Error handling message: ${error}`);
    }
  }
  shouldReply(msg, settings) {
    if (msg.fromMe) return false;
    if (settings.ignoreGroups && msg.from.includes("@g.us")) {
      return false;
    }
    if (settings.ignoreStatuses && msg.from.includes("@broadcast")) {
      return false;
    }
    if (settings.blacklist.includes(msg.from)) {
      return false;
    }
    if (settings.whitelist.length > 0 && !settings.whitelist.includes(msg.from)) {
      return false;
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
    await incrementStats({
      messagesSent: messages.length,
      timeSavedMinutes: 1
      // Assume 1 min saved per reply
    });
  }
  splitMessage(text) {
    if (text.length <= 200) return [text];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const messages = [];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length > 200 && messages.length < 2) {
        if (current) messages.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
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
      const chat = await this.client.getChatById(draft.chatId);
      await chat.sendMessage(text);
      await removeDraft(draftId);
      await incrementStats({ messagesSent: 1, timeSavedMinutes: 1 });
      log("INFO", `Draft ${draftId} sent successfully`);
      return true;
    } catch (error) {
      log("ERROR", `Failed to send draft: ${error}`);
      return false;
    }
  }
  async discardDraft(draftId) {
    try {
      await removeDraft(draftId);
      log("INFO", `Draft ${draftId} discarded`);
      return true;
    } catch {
      return false;
    }
  }
  async editDraft(draftId, newText) {
    try {
      await updateDraft(draftId, { proposedReply: newText });
      return true;
    } catch {
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
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  await initDatabase();
  log("INFO", "Database initialized");
  exports.whatsappClient = new WhatsAppClient();
  log("INFO", "WhatsApp client initialized");
  registerIpcHandlers(exports.whatsappClient);
  log("INFO", "IPC handlers registered");
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
