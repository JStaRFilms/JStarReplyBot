import { useState } from 'react'
import { Plus, Edit, Trash2, Users } from 'lucide-react'

interface ContactCategory {
    id: string
    name: string
    description?: string
    color: string
}

interface ContactCategoriesPanelProps {
    categories: ContactCategory[]
    onAddCategory: (category: Omit<ContactCategory, 'id'>) => void
    onUpdateCategory: (id: string, updates: Partial<ContactCategory>) => void
    onDeleteCategory: (id: string) => void
}

export function ContactCategoriesPanel({
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory
}: ContactCategoriesPanelProps) {
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        color: '#3b82f6'
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingCategory, setEditingCategory] = useState<Partial<ContactCategory>>({})

    const handleAddCategory = () => {
        if (!newCategory.name.trim()) return

        onAddCategory({
            name: newCategory.name,
            description: newCategory.description,
            color: newCategory.color
        })

        setNewCategory({ name: '', description: '', color: '#3b82f6' })
    }

    const handleEditCategory = (category: ContactCategory) => {
        setEditingId(category.id)
        setEditingCategory(category)
    }

    const handleSaveEdit = () => {
        if (!editingId || !editingCategory.name) return

        onUpdateCategory(editingId, editingCategory)
        setEditingId(null)
        setEditingCategory({})
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditingCategory({})
    }

    return (
        <div className="space-y-6">
            {/* Add New Category */}
            <div className="glass p-6 rounded-2xl space-y-4">
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Add New Category
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category Name</label>
                        <input
                            type="text"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Family, Friends, Work, etc."
                            className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
                        <input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                    <input
                        type="text"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description for this category"
                        className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>

                <button
                    onClick={handleAddCategory}
                    disabled={!newCategory.name.trim()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Add Category
                </button>
            </div>

            {/* Categories List */}
            <div className="glass p-6 rounded-2xl">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">Your Categories</h3>

                {categories.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        No categories yet. Add your first category above!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categories.map(category => (
                            <div key={category.id} className="border border-slate-200 dark:border-white/10 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-surface-800 transition-colors">
                                {editingId === category.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                value={editingCategory.name || ''}
                                                onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                            />
                                            <input
                                                type="color"
                                                value={editingCategory.color || '#3b82f6'}
                                                onChange={(e) => setEditingCategory(prev => ({ ...prev, color: e.target.value }))}
                                                className="w-full h-10 bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={editingCategory.description || ''}
                                            onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Optional description"
                                            className="w-full bg-slate-50 dark:bg-surface-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
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
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <div>
                                                <h4 className="font-medium text-slate-900 dark:text-white">{category.name}</h4>
                                                {category.description && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditCategory(category)}
                                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteCategory(category.id)}
                                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}