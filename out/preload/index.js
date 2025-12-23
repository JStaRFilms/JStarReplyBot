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
const electronAPI = {
  // Bot control
  startBot: () => electron.ipcRenderer.invoke(IPC_CHANNELS.START_BOT),
  stopBot: () => electron.ipcRenderer.invoke(IPC_CHANNELS.STOP_BOT),
  getStatus: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS),
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
  }
};
electron.contextBridge.exposeInMainWorld("electron", electronAPI);
