import { BrowserWindow } from 'electron'
import type { LogLevel, LogEntry } from '../shared/types'
import { IPC_CHANNELS } from '../shared/types'

const logs: LogEntry[] = []
const MAX_LOGS = 1000

export function log(level: LogLevel, message: string): void {
    const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        message
    }

    logs.push(entry)

    // Keep logs bounded
    if (logs.length > MAX_LOGS) {
        logs.shift()
    }

    // Console output for dev
    const prefix = `[${new Date(entry.timestamp).toLocaleTimeString()}] ${level}`
    console.log(`${prefix}: ${message}`)

    // Send to renderer
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(win => {
        win.webContents.send(IPC_CHANNELS.ON_LOG, entry)
    })
}

export function getLogs(): LogEntry[] {
    return [...logs]
}

export function exportLogs(): string {
    return logs.map(entry => {
        const time = new Date(entry.timestamp).toISOString()
        return `[${time}] ${entry.level}: ${entry.message}`
    }).join('\n')
}
