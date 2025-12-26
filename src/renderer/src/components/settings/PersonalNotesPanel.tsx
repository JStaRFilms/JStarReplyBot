import { useState } from 'react'
import { Plus, Edit, Trash2, StickyNote, Users } from 'lucide-react'

interface PersonalNote {
    id: string
    title: string
    content: string
    category?: string
    contactId?: string
    createdAt: number
    updatedAt: number
}

interface Contact {
    id: string
    name: string
    number: string
}

interface PersonalNotesPanelProps {
    notes: PersonalNote[]
    categories: Array<{ id: string; name: string; color: string }>
    contacts: Contact[]
    onAddNote: (note: Omit<PersonalNote, 'id'>) => void
    onUpdateNote: (id: string, updates: Partial<PersonalNote>) => void
    onDeleteNote: (id: string) => void
}

export function PersonalNotesPanel({
    notes,
    categories,
    contacts,
    onAddNote,
    onUpdateNote,
    onDeleteNote
}: PersonalNotesPanelProps) {
    const [newNote, setNewNote] = useState({
        title: '',
        content: '',
        category: '',
        contactId: ''
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingNote, setEditingNote] = useState<Partial<PersonalNote>>({})
    const [viewMode, setViewMode] = useState<'all' | 'by-contact' | 'by-category'>('all')

    const handleAddNote = () => {
        if (!newNote.title.trim() || !newNote.content.trim()) return

        onAddNote({
            title: newNote.title,
            content: newNote.content,
            category: newNote.category || undefined,
            contactId: newNote.contactId || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        setNewNote({ title: '', content: '', category: '', contactId: '' })
    }

    const handleEditNote = (note: PersonalNote) => {
        setEditingId(note.id)
        setEditingNote(note)
    }

    const handleSaveEdit = () => {
        if (!editingId || !editingNote.title || !editingNote.content) return

        onUpdateNote(editingId, {
            ...editingNote,
            updatedAt: Date.now()
        })

        setEditingId(null)
        setEditingNote({})
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditingNote({})
    }

    const getContactName = (contactId: string) => {
        const contact = contacts.find(c => c.id === contactId)
        return contact ? contact.name : 'Unknown Contact'
    }

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId)
        return category ? category.name : 'General'
    }

    const filteredNotes = notes.filter(note => {
        if (viewMode === 'by-contact' && !note.contactId) return false
        if (viewMode === 'by-category' && !note.category) return false
        return true
    })

    const groupNotesByContact = () => {
        const grouped = contacts.map(contact => ({
            contact,
            notes: filteredNotes.filter(note => note.contactId === contact.id)
        })).filter(group => group.notes.length > 0)
        return grouped
    }

    const groupNotesByCategory = () => {
        const grouped = categories.map(category => ({
            category,
            notes: filteredNotes.filter(note => note.category === category.id)
        })).filter(group => group.notes.length > 0)
        return grouped
    }

    return (
        <div className="space-y-6">
            {/* View Mode Toggle */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">View Mode</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'all'
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-200 dark:bg-surface-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'
                            }`}
                    >
                        All Notes
                    </button>
                    <button
                        onClick={() => setViewMode('by-contact')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'by-contact'
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-200 dark:bg-surface-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'
                            }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        By Contact
                    </button>
                    <button
                        onClick={() => setViewMode('by-category')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'by-category'
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-200 dark:bg-surface-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/10'
                            }`}
                    >
                        <StickyNote className="w-4 h-4 inline mr-2" />
                        By Category
                    </button>
                </div>
            </div>

            {/* Add New Note */}
            <div className="glass p-6 rounded-2xl space-y-4">
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Note
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                        <input
                            type="text"
                            value={newNote.title}
                            onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Meeting notes, Ideas, etc."
                            className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                        <select
                            value={newNote.category}
                            onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        >
                            <option value="">Select category</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact (Optional)</label>
                    <select
                        value={newNote.contactId}
                        onChange={(e) => setNewNote(prev => ({ ...prev, contactId: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    >
                        <option value="">Select contact</option>
                        {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                                {contact.name} ({contact.number})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Content</label>
                    <textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your note here..."
                        className="w-full h-24 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none text-slate-600 dark:text-slate-400"
                    />
                </div>

                <button
                    onClick={handleAddNote}
                    disabled={!newNote.title.trim() || !newNote.content.trim()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Add Note
                </button>
            </div>

            {/* Notes List */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                    {viewMode === 'all' && 'All Notes'}
                    {viewMode === 'by-contact' && 'Notes by Contact'}
                    {viewMode === 'by-category' && 'Notes by Category'}
                </h3>

                {filteredNotes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        No notes found. Add your first note above!
                    </div>
                ) : viewMode === 'all' ? (
                    <div className="space-y-4">
                        {filteredNotes.map(note => (
                            <div key={note.id} className="border border-slate-200 dark:border-white/10 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-surface-800 transition-colors">
                                {editingId === note.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                value={editingNote.title || ''}
                                                onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                            />
                                            <select
                                                value={editingNote.category || ''}
                                                onChange={(e) => setEditingNote(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <select
                                            value={editingNote.contactId || ''}
                                            onChange={(e) => setEditingNote(prev => ({ ...prev, contactId: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        >
                                            <option value="">Select contact</option>
                                            {contacts.map(contact => (
                                                <option key={contact.id} value={contact.id}>
                                                    {contact.name} ({contact.number})
                                                </option>
                                            ))}
                                        </select>
                                        <textarea
                                            value={editingNote.content || ''}
                                            onChange={(e) => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full h-24 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none text-slate-600 dark:text-slate-400"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveEdit}
                                                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-surface-800 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: note.category ? categories.find(c => c.id === note.category)?.color : '#3b82f6' }}
                                                />
                                                <h4 className="font-medium text-slate-900 dark:text-white">{note.title}</h4>
                                                {note.contactId && (
                                                    <span className="text-xs bg-slate-100 dark:bg-surface-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full">
                                                        {getContactName(note.contactId)}
                                                    </span>
                                                )}
                                                {note.category && (
                                                    <span className="text-xs bg-slate-100 dark:bg-surface-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full">
                                                        {getCategoryName(note.category)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditNote(note)}
                                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteNote(note.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{note.content}</p>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                                            <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : viewMode === 'by-contact' ? (
                    <div className="space-y-6">
                        {groupNotesByContact().map(({ contact, notes }) => (
                            <div key={contact.id} className="border border-slate-200 dark:border-white/10 rounded-lg p-4">
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {contact.name} ({contact.number})
                                </h4>
                                <div className="space-y-3">
                                    {notes.map(note => (
                                        <div key={note.id} className="bg-slate-50 dark:bg-surface-800 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium text-slate-900 dark:text-white">{note.title}</h5>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditNote(note)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteNote(note.id)}
                                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{note.content}</p>
                                            {note.category && (
                                                <span className="text-xs bg-slate-100 dark:bg-surface-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full mt-2 inline-block">
                                                    {getCategoryName(note.category)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupNotesByCategory().map(({ category, notes }) => (
                            <div key={category.id} className="border border-slate-200 dark:border-white/10 rounded-lg p-4">
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span
                                        className="w-4 h-4 rounded-full inline-block mr-2"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    {category.name}
                                </h4>
                                <div className="space-y-3">
                                    {notes.map(note => (
                                        <div key={note.id} className="bg-slate-50 dark:bg-surface-800 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium text-slate-900 dark:text-white">{note.title}</h5>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditNote(note)}
                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteNote(note.id)}
                                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{note.content}</p>
                                            {note.contactId && (
                                                <span className="text-xs bg-slate-100 dark:bg-surface-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full mt-2 inline-block">
                                                    {getContactName(note.contactId)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}