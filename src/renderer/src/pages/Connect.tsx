import { useState, useEffect } from 'react'
import { ArrowLeft, Info, RefreshCw, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../store'

export default function ConnectPage() {
    const { connectionStatus, setConnectionStatus, setActivePage } = useAppStore()
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        // Subscribe to QR code updates
        const unsubQR = window.electron.onQRCode((qr: string) => {
            setQrCode(qr)
            setErrorMessage(null)
            setConnectionStatus('qr_ready')
        })

        const unsubReady = window.electron.onReady(() => {
            setErrorMessage(null)
            setConnectionStatus('connected')
        })

        const unsubDisconnected = window.electron.onDisconnected((reason: string) => {
            setErrorMessage(`Disconnected: ${reason}`)
            setConnectionStatus('error')
        })

        return () => {
            unsubQR()
            unsubReady()
            unsubDisconnected()
        }
    }, [])

    const handleStartBot = async () => {
        setIsStarting(true)
        setErrorMessage(null)
        try {
            setConnectionStatus('connecting')
            const result = await window.electron.startBot()
            if (!result.success) {
                setErrorMessage(result.error || 'Failed to connect. Check your internet connection.')
                setConnectionStatus('error')
            }
        } catch (error) {
            setErrorMessage(String(error))
            setConnectionStatus('error')
        } finally {
            setIsStarting(false)
        }
    }

    const handleRetry = () => {
        setErrorMessage(null)
        setConnectionStatus('disconnected')
        handleStartBot()
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-200px)]">
            {/* Back button */}
            <nav className="mb-8">
                <button
                    onClick={() => setActivePage('home')}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Instructions */}
                    <div className="space-y-8 order-2 md:order-1">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Connect WhatsApp</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg">Scan the QR code to link your account.</p>
                        </div>

                        <div className="space-y-6">
                            <Step number={1} title="Open WhatsApp on your phone" description="Go to Settings > Linked Devices" />
                            <Step number={2} title='Tap "Link a Device"' description="You might need to use FaceID or Fingerprint." />
                            <Step number={3} title="Point your camera at the screen" description="The app will connect automatically." />
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200">
                            <Info className="w-5 h-5 shrink-0 text-amber-500" />
                            <p>Your session is stored locally on your device. We never see your messages.</p>
                        </div>
                    </div>

                    {/* QR Code Area */}
                    <div className="order-1 md:order-2 flex flex-col items-center">
                        <div className="glass p-8 rounded-3xl relative group">
                            {/* Scan line animation */}
                            {connectionStatus === 'qr_ready' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-scan opacity-50" />
                            )}

                            <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                                {connectionStatus === 'connected' ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">✓</span>
                                        </div>
                                        <p className="text-emerald-600 font-semibold">Connected!</p>
                                    </div>
                                ) : connectionStatus === 'error' ? (
                                    <div className="text-center p-4">
                                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                                        </div>
                                        <p className="text-rose-600 font-semibold mb-2">Connection Failed</p>
                                        <p className="text-slate-500 text-xs mb-4 max-w-[200px]">
                                            {errorMessage || 'Unable to connect to WhatsApp'}
                                        </p>
                                        <button
                                            onClick={handleRetry}
                                            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Retry
                                        </button>
                                    </div>
                                ) : qrCode ? (
                                    <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center p-4">
                                        {isStarting || connectionStatus === 'connecting' ? (
                                            <>
                                                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                                <p className="text-slate-500 text-sm">Starting WhatsApp...</p>
                                                <p className="text-slate-400 text-xs mt-2">This may take 30-60 seconds</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-slate-400 text-sm mb-4">Click to generate QR code</p>
                                                <button
                                                    onClick={handleStartBot}
                                                    className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                                >
                                                    Start Connection
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {connectionStatus === 'qr_ready' && (
                            <p className="mt-6 flex items-center gap-2 text-sm text-emerald-500 font-medium animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Waiting for scan...
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-surface-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                {number}
            </div>
            <div>
                <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    )
}
