import { ArrowLeft, UploadCloud, FileText, FileCode, RefreshCw, Trash2 } from 'lucide-react'
import { useAppStore, useDocumentsStore } from '../store'
import type { KnowledgeDocument } from '../../../shared/types'

export default function BrainPage() {
    const { setActivePage } = useAppStore()
    const { documents, addDocument, removeDocument } = useDocumentsStore()

    const totalSize = documents.reduce((acc, d) => acc + d.sizeBytes, 0)
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1048576).toFixed(1)} MB`
    }

    const handleUpload = async () => {
        const res = await window.electron.uploadDocument()
        if (res.success && res.data) {
            addDocument(res.data)
        }
    }

    const handleDelete = async (id: string) => {
        const res = await window.electron.deleteDocument(id)
        if (res.success) {
            removeDocument(id)
        }
    }

    const handleReindex = async (id: string) => {
        await window.electron.reindexDocument(id)
    }

    const getFileIcon = (type: string) => {
        if (type === 'pdf') return <FileText className="w-5 h-5" />
        return <FileCode className="w-5 h-5" />
    }

    const getFileColor = (type: string) => {
        if (type === 'pdf') return 'bg-rose-100 dark:bg-rose-500/10 text-rose-500'
        return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500'
    }

    const timeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
        return 'yesterday'
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <nav className="flex items-center justify-between">
                <button
                    onClick={() => setActivePage('home')}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>
                <h1 className="font-bold text-xl text-slate-900 dark:text-white">Knowledge Base (The Brain)</h1>
                <div className="w-8" /> {/* Spacer */}
            </nav>

            {/* Upload Zone */}
            <div
                onClick={handleUpload}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer bg-slate-50/50 dark:bg-surface-800/30 group"
            >
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Business Documents</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    Drag & drop PDF, TXT, or MD files here. The bot will read them to answer questions.
                </p>
                <button className="mt-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Select Files
                </button>
            </div>

            {/* Document List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="font-semibold text-slate-900 dark:text-white">Indexed Documents</h2>
                    <span className="text-xs text-slate-500">
                        {documents.length} files • {formatSize(totalSize)} total
                    </span>
                </div>

                {documents.length === 0 ? (
                    <div className="glass rounded-xl p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No documents indexed yet</p>
                        <p className="text-sm text-slate-400 mt-1">Upload files to teach the AI about your business</p>
                    </div>
                ) : (
                    <div className="glass rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                        {documents.map(doc => (
                            <DocumentItem
                                key={doc.id}
                                doc={doc}
                                icon={getFileIcon(doc.type)}
                                iconColor={getFileColor(doc.type)}
                                timeAgo={timeAgo(doc.indexedAt)}
                                onDelete={() => handleDelete(doc.id)}
                                onReindex={() => handleReindex(doc.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function DocumentItem({
    doc,
    icon,
    iconColor,
    timeAgo,
    onDelete,
    onReindex
}: {
    doc: KnowledgeDocument
    icon: React.ReactNode
    iconColor: string
    timeAgo: string
    onDelete: () => void
    onReindex: () => void
}) {
    return (
        <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 group transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{doc.name}</p>
                    <p className="text-xs text-slate-500">Indexed {timeAgo} • {doc.vectorCount} vectors</p>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onReindex}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Re-index"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
