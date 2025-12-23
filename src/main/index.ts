import { config } from 'dotenv'
import { join, resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { app, shell, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { WhatsAppClient } from './whatsapp'
import { initDatabase } from './db'
import { log } from './logger'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let whatsappClient: WhatsAppClient | null = null
let isQuitting = false

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        frame: true,
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0f172a',
        icon: join(__dirname, '../../resources/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // Load dev server or production build
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // Minimize to tray instead of close
    mainWindow.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault()
            mainWindow?.hide()
        }
    })
}

function createTray(): void {
    const iconPath = join(__dirname, '../../resources/icon.png')
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

    tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open JStarReplyBot',
            click: () => mainWindow?.show()
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('JStarReplyBot')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => mainWindow?.show())
}

app.whenReady().then(async () => {
    // Set app user model id for Windows
    electronApp.setAppUserModelId('com.jstar.replybot')

    // Default open or close DevTools by F12 in development
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // Initialize database
    await initDatabase()
    log('INFO', 'Database initialized')

    // Initialize WhatsApp client
    whatsappClient = new WhatsAppClient()
    log('INFO', 'WhatsApp client initialized')

    // Register IPC handlers
    registerIpcHandlers(whatsappClient)
    log('INFO', 'IPC handlers registered (v2 with Catalog)')

    // Create window and tray
    createWindow()
    createTray()

    // Auto-start WhatsApp client (will reconnect if session exists)
    try {
        log('INFO', 'Auto-starting WhatsApp client...')
        await whatsappClient.start()
    } catch (error) {
        log('WARN', `Auto-start failed (may need QR scan): ${error}`)
    }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Cleanup on app quit
app.on('before-quit', async () => {
    log('INFO', 'Application quitting, cleaning up...')
    if (whatsappClient) {
        try {
            await whatsappClient.stop()
            log('INFO', 'WhatsApp client stopped successfully')
        } catch (error) {
            log('ERROR', `Error stopping WhatsApp client: ${error}`)
        }
    }
})



// Export for IPC access
export { mainWindow, whatsappClient }
