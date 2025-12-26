import { useState, useEffect } from 'react'
import { Edit, Trash2, Search, Users, Tag, Download, Upload, RefreshCw, TestTube, Bug, Database, BarChart3, Eye } from 'lucide-react'
import { useFeatureGating } from '@/hooks/useFeatureGating'
import { IPC_CHANNELS } from '../../../../shared/types'

interface Contact {
    id: string
    name: string
    number: string
    isSaved: boolean
    categories: string[]
    personalNotes: string[]
    lastContacted?: number
    createdAt: number
}

interface ContactCategory {
    id: string
    name: string
    description?: string
    color: string
}

interface ContactSystemStatus {
    totalContacts: number
    totalNotes: number
    totalCategories: number
    lastSyncTime?: number
    hasTestContacts: boolean
    whatsappConnected: boolean
}

export function ContactManagementPanel() {
    const { contactManagement } = useFeatureGating()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [categories, setCategories] = useState<ContactCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<'name' | 'lastContacted' | 'createdAt'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [systemStatus, setSystemStatus] = useState<ContactSystemStatus | null>(null)
    const [debugMode, setDebugMode] = useState(false)
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    useEffect(() => {
        loadContacts()
        loadCategories()
        loadSystemStatus()
    }, [])

    const loadContacts = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke(IPC_CHANNELS.GET_CONTACTS)
            if (result.success) {
                setContacts(result.data || [])
            }
        } catch (error) {
            console.error('Failed to load contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadCategories = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('contacts:get-categories')
            if (result.success) {
                setCategories(result.data || [])
            }
        } catch (error) {
            console.error('Failed to load categories:', error)
        }
    }

    const loadSystemStatus = async () => {
        try {
            const result = await window.electron.ipcRenderer.invoke('contacts:get-status')
            if (result.success) {
                setSystemStatus(result.data)
            }
        } catch (error) {
            console.error('Failed to load system status:', error)
        }
    }

    const loadWhatsAppContacts = async () => {
        try {
            setLoading(true)
            const result = await window.electron.ipcRenderer.invoke('contacts:load-whatsapp')
            if (result.success) {
                alert(`Loaded ${result.data.loaded} contacts from WhatsApp, skipped ${result.data.skipped}`)
                await loadContacts()
                await loadSystemStatus()
            } else {
                alert('Failed to load WhatsApp contacts: ' + result.error)
            }
        } catch (error) {
            console.error('Failed to load WhatsApp contacts:', error)
            alert('Error loading WhatsApp contacts')
        } finally {
            setLoading(false)
        }
    }

    const createTestContacts = async () => {
        try {
            setLoading(true)
            const result = await window.electron.ipcRenderer.invoke('contacts:create-test')
            if (result.success) {
                alert(`Created ${result.data.created} test contacts`)
                await loadContacts()
                await loadSystemStatus()
            } else {
                alert('Failed to create test contacts: ' + result.error)
            }
        } catch (error) {
            console.error('Failed to create test contacts:', error)
            alert('Error creating test contacts')
        } finally {
            setLoading(false)
        }
    }

    const clearAllContacts = async () => {
        if (!window.confirm('Are you sure you want to clear all contacts and notes? This action cannot be undone.')) {
            return
        }

        try {
            setLoading(true)
            const result = await window.electron.ipcRenderer.invoke('contacts:clear-all')
            if (result.success) {
                alert('All contacts and notes cleared')
                await loadContacts()
                await loadSystemStatus()
            } else {
                alert('Failed to clear contacts: ' + result.error)
            }
        } catch (error) {
            console.error('Failed to clear contacts:', error)
            alert('Error clearing contacts')
        } finally {
            setLoading(false)
        }
    }

    const getContactDebugInfo = async (contactId: string) => {
        try {
            const result = await window.electron.ipcRenderer.invoke('contacts:get-debug-info', contactId)
            if (result.success) {
                setDebugInfo(result.data)
                setSelectedContactId(contactId)
            }
        } catch (error) {
            console.error('Failed to get debug info:', error)
        }
    }

    const handleSearch = async () => {
        try {
            const filter = {
                query: searchQuery || undefined,
                categories: selectedCategories.length > 0 ? selectedCategories : undefined,
                sortBy,
                sortOrder
            }

            const result = await window.electron.ipcRenderer.invoke(IPC_CHANNELS.SEARCH_CONTACTS, filter)
            if (result.success) {
                setContacts(result.data || [])
            }
        } catch (error) {
            console.error('Failed to search contacts:', error)
        }
    }



    const handleBatchAssign = async () => {
        const contactNumbers = contacts.map(c => c.number)
        const categoryIds = selectedCategories

        if (contactNumbers.length === 0 || categoryIds.length === 0) {
            alert('Please select contacts and categories')
            return
        }

        try {
            const result = await window.electron.ipcRenderer.invoke('contacts:batch-assign', {
                categoryIds,
                contactNumbers
            })
            if (result.success) {
                loadContacts() // Refresh contacts
                alert(`Successfully assigned categories to ${result.data.success} contacts`)
            }
        } catch (error) {
            console.error('Failed to batch assign categories:', error)
        }
    }

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'Never'
        return new Date(timestamp).toLocaleDateString()
    }



    if (!contactManagement) {
        return (
            <div className="glass p-6 rounded-2xl">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">Contact Management</h3>
                <p className="text-slate-600 dark:text-slate-400">This feature is only available in the Personal edition.</p>
            </div>
        )
    }

    // System Status Panel
    const SystemStatusPanel = () => (
        <div className="glass p-6 rounded-2xl mb-6">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Database className="w-5 h-5" />
                System Status
            </h3>
            {systemStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-surface-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemStatus.totalContacts}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Contacts</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-surface-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemStatus.totalNotes}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Notes</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-surface-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemStatus.totalCategories}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Categories</div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-slate-500">Loading system status...</div>
            )}
        </div>
    )

    // Debug Panel
    const DebugPanel = () => (
        <div className="glass p-6 rounded-2xl mb-6">
            <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <Bug className="w-5 h-5" />
                Debug Tools
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <button
                        onClick={loadWhatsAppContacts}
                        disabled={loading || !systemStatus?.whatsappConnected}
                        className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className="w-4 h-4 mr-2 inline" />
                        Load WhatsApp Contacts
                    </button>
                    <button
                        onClick={createTestContacts}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        <TestTube className="w-4 h-4 mr-2 inline" />
                        Create Test Contacts
                    </button>
                    <button
                        onClick={clearAllContacts}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        Clear All Contacts
                    </button>
                </div>
                <div className="space-y-2">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        WhatsApp Status: {systemStatus?.whatsappConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Test Contacts: {systemStatus?.hasTestContacts ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Last Sync: {systemStatus?.lastSyncTime ? new Date(systemStatus.lastSyncTime).toLocaleString() : 'Never'}
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* System Status */}
            <SystemStatusPanel />

            {/* Debug Tools */}
            <DebugPanel />

            {/* Search and Filter */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                    <Search className="w-5 h-5" />
                    Contact Search & Filter
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search contacts by name or number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="lastContacted">Last Contacted</option>
                        <option value="createdAt">Created Date</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Search className="w-4 h-4 mr-2 inline" />
                        Search
                    </button>
                    <button
                        onClick={loadContacts}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Users className="w-4 h-4 mr-2 inline" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Contact List */}
            <div className="glass p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-3">
                            <Users className="w-5 h-5" />
                            Contacts ({contacts.length})
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            View and manage your WhatsApp contacts
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBatchAssign}
                            disabled={selectedCategories.length === 0}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Tag className="w-4 h-4 mr-2 inline" />
                            Batch Assign Categories
                        </button>
                        <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                            <Upload className="w-4 h-4 mr-2 inline" />
                            Import
                        </button>
                        <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                            <Download className="w-4 h-4 mr-2 inline" />
                            Export
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-slate-500">Loading contacts...</div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        No contacts found. Contacts will be automatically added when they message you.
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {contacts.map((contact) => (
                            <div key={contact.id} className="border border-slate-200 dark:border-white/10 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-surface-800 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-200 dark:bg-surface-700 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {contact.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white">{contact.name}</h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{contact.number}</p>
                                        </div>
                                        {contact.isSaved && (
                                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                                                Saved Contact
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => getContactDebugInfo(contact.id)}
                                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
                                        >
                                            <Eye className="w-4 h-4 inline mr-1" />
                                            Debug
                                        </button>
                                        <button className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors">
                                            <Edit className="w-4 h-4 inline mr-1" />
                                            Edit
                                        </button>
                                        <button className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm transition-colors">
                                            <Trash2 className="w-4 h-4 inline mr-1" />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        {contact.categories.map((categoryId) => {
                                            const category = categories.find(c => c.id === categoryId)
                                            return category ? (
                                                <span
                                                    key={categoryId}
                                                    style={{ backgroundColor: category.color }}
                                                    className="text-white px-2 py-1 rounded-full text-xs"
                                                >
                                                    {category.name}
                                                </span>
                                            ) : null
                                        })}
                                        {contact.categories.length === 0 && (
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-surface-700 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                                                No categories
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Last contacted: {formatDate(contact.lastContacted)}
                                    </div>
                                </div>

                                {contact.personalNotes.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Notes: {contact.personalNotes.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Category Assignment Panel */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                    <Tag className="w-5 h-5" />
                    Category Management
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                            Select Categories to Assign
                        </label>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(category.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedCategories([...selectedCategories, category.id])
                                            } else {
                                                setSelectedCategories(selectedCategories.filter(id => id !== category.id))
                                            }
                                        }}
                                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <span
                                        style={{ backgroundColor: category.color }}
                                        className="text-white px-2 py-1 rounded-full text-sm"
                                    >
                                        {category.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                            Selected Contacts
                        </label>
                        <div className="bg-slate-50 dark:bg-surface-800 rounded-lg p-3">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {contacts.length} contacts selected
                            </p>
                            {contacts.length > 0 && (
                                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                    {contacts.slice(0, 5).map((contact) => (
                                        <div key={contact.id} className="text-sm text-slate-700 dark:text-slate-300">
                                            {contact.name}
                                        </div>
                                    ))}
                                    {contacts.length > 5 && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            +{contacts.length - 5} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleBatchAssign}
                        disabled={selectedCategories.length === 0 || contacts.length === 0}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Tag className="w-4 h-4 mr-2 inline" />
                        Assign Categories to Selected Contacts
                    </button>
                </div>
            </div>

            {/* Debug Info Modal */}
            {debugInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-slate-900 dark:text-white text-lg">
                                    Debug Info: {debugInfo.contact?.name || 'Unknown Contact'}
                                </h3>
                                <button
                                    onClick={() => setDebugInfo(null)}
                                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Contact Details</h4>
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-surface-700 p-4 rounded-lg">
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Name:</span>
                                        <div className="font-medium">{debugInfo.contact?.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Number:</span>
                                        <div className="font-medium">{debugInfo.contact?.number || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Saved:</span>
                                        <div className="font-medium">{debugInfo.contact?.isSaved ? 'Yes' : 'No'}</div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Created:</span>
                                        <div className="font-medium">{debugInfo.contact?.createdAt ? new Date(debugInfo.contact.createdAt).toLocaleString() : 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {debugInfo.categories.map((cat: any) => (
                                        <span
                                            key={cat.id}
                                            style={{ backgroundColor: cat.color }}
                                            className="text-white px-3 py-1 rounded-full text-sm"
                                        >
                                            {cat.name}
                                        </span>
                                    ))}
                                    {debugInfo.categories.length === 0 && (
                                        <span className="text-slate-500 dark:text-slate-400">No categories assigned</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Notes</h4>
                                <div className="space-y-2">
                                    {debugInfo.notes.map((note: any) => (
                                        <div key={note.id} className="bg-slate-50 dark:bg-surface-700 p-3 rounded-lg">
                                            <div className="font-medium text-slate-900 dark:text-white">{note.title}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">{note.content}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Created: {new Date(note.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                    {debugInfo.notes.length === 0 && (
                                        <span className="text-slate-500 dark:text-slate-400">No notes</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">AI Context</h4>
                                {debugInfo.aiContext ? (
                                    <div className="bg-slate-50 dark:bg-surface-700 p-4 rounded-lg">
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                            Has Memory: {debugInfo.aiContext.hasMemory ? 'Yes' : 'No'}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                            Recent History: {debugInfo.aiContext.recentHistory.length} messages
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            Semantic Memory: {debugInfo.aiContext.semanticMemory.length} matches
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-slate-500 dark:text-slate-400">No AI context available</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}