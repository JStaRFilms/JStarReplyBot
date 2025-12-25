"use strict";
const electron = require("electron");
const zod = require("zod");
zod.z.object({
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
  activePersonaId: zod.z.string().optional(),
  // Conversation Memory (Per-Contact Vector Storage)
  conversationMemory: zod.z.object({
    enabled: zod.z.boolean().default(true),
    maxMessagesPerContact: zod.z.number().default(500),
    ttlDays: zod.z.number().default(30)
    // 0 = infinite
  }).default({}),
  // Owner Interception (Collaborative Mode)
  // Detects when YOU (the owner) message a customer and adjusts bot behavior accordingly
  ownerIntercept: zod.z.object({
    enabled: zod.z.boolean().default(true),
    pauseDurationMs: zod.z.number().default(15e3),
    // Extra pause when owner types (15s)
    doubleTextEnabled: zod.z.boolean().default(true)
    // Allow bot to follow up after owner
  }).default({})
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
const electronAPI = {
  // Bot control
  startBot: () => electron.ipcRenderer.invoke(IPC_CHANNELS.START_BOT),
  stopBot: () => electron.ipcRenderer.invoke(IPC_CHANNELS.STOP_BOT),
  getStatus: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS),
  // Catalog
  getCatalog: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_CATALOG),
  addProduct: (item) => electron.ipcRenderer.invoke(IPC_CHANNELS.ADD_PRODUCT, item),
  updateProduct: (data) => electron.ipcRenderer.invoke(IPC_CHANNELS.UPDATE_PRODUCT, data),
  deleteProduct: (id) => electron.ipcRenderer.invoke(IPC_CHANNELS.DELETE_PRODUCT, id),
  // QR Auth
  getQRCode: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_QR),
  onQRCode: (callback) => {
    const handler = (_, qr) => callback(qr);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_QR, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_QR, handler);
  },
  onReady: (callback) => {
    const handler = () => callback();
    electron.ipcRenderer.on(IPC_CHANNELS.ON_READY, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_READY, handler);
  },
  onDisconnected: (callback) => {
    const handler = (_, reason) => callback(reason);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_DISCONNECTED, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_DISCONNECTED, handler);
  },
  // Settings
  getSettings: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  saveSettings: (settings) => electron.ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),
  // Knowledge Base
  uploadDocument: () => electron.ipcRenderer.invoke(IPC_CHANNELS.UPLOAD_DOCUMENT),
  deleteDocument: (id) => electron.ipcRenderer.invoke(IPC_CHANNELS.DELETE_DOCUMENT, id),
  getDocuments: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_DOCUMENTS),
  reindexDocument: (id) => electron.ipcRenderer.invoke(IPC_CHANNELS.REINDEX_DOCUMENT, id),
  // Drafts
  getDrafts: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_DRAFTS),
  sendDraft: (id, editedText) => electron.ipcRenderer.invoke(IPC_CHANNELS.SEND_DRAFT, id, editedText),
  discardDraft: (id) => electron.ipcRenderer.invoke(IPC_CHANNELS.DISCARD_DRAFT, id),
  editDraft: (id, newText) => electron.ipcRenderer.invoke(IPC_CHANNELS.EDIT_DRAFT, id, newText),
  onNewDraft: (callback) => {
    const handler = (_, draft) => callback(draft);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_NEW_DRAFT, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_NEW_DRAFT, handler);
  },
  // License
  validateLicense: (key) => electron.ipcRenderer.invoke(IPC_CHANNELS.VALIDATE_LICENSE, key),
  getLicenseStatus: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_LICENSE_STATUS),
  // Logs
  getLogs: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_LOGS),
  exportLogs: () => electron.ipcRenderer.invoke(IPC_CHANNELS.EXPORT_LOGS),
  onLog: (callback) => {
    const handler = (_, entry) => callback(entry);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_LOG, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_LOG, handler);
  },
  // Stats
  getStats: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_STATS),
  onStatsUpdate: (callback) => {
    const handler = (_, stats) => callback(stats);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_STATS_UPDATE, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_STATS_UPDATE, handler);
  },
  // Activity
  onActivity: (callback) => {
    const handler = (_, activity) => callback(activity);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_ACTIVITY, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_ACTIVITY, handler);
  },
  // System
  seedDB: () => electron.ipcRenderer.invoke(IPC_CHANNELS.SEED_DB),
  // Smart Queue
  onQueueUpdate: (callback) => {
    const handler = (_, items) => callback(items);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_QUEUE_UPDATE, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_QUEUE_UPDATE, handler);
  },
  onQueueProcessed: (callback) => {
    const handler = (_, event) => callback(event);
    electron.ipcRenderer.on(IPC_CHANNELS.ON_QUEUE_PROCESSED, handler);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ON_QUEUE_PROCESSED, handler);
  }
};
electron.contextBridge.exposeInMainWorld("electron", electronAPI);
