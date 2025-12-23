import { useState } from 'react'
import { Plus, Search, Tag, Package, Edit, Trash2, X, Save } from 'lucide-react'
import { useCatalogStore } from '../store'
import type { CatalogItem } from '../../../shared/types'

export default function CatalogPage() {
    const { catalog, addCatalogItem, updateCatalogItem, removeCatalogItem } = useCatalogStore()
    const [search, setSearch] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [editingItem, setEditingItem] = useState<Partial<CatalogItem> | null>(null)
    const [tagsInput, setTagsInput] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const filteredCatalog = catalog.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    )

    const handleSave = async () => {
        // Validate
        if (!editingItem?.name) {
            console.error('Missing name')
            return
        }
        if (editingItem.price === undefined || editingItem.price === null) {
            console.error('Missing price')
            return
        }

        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

        setIsSaving(true)
        try {
            if (editingItem.id) {
                // Update
                const updates = { ...editingItem, tags, updatedAt: Date.now() } as CatalogItem
                const res = await window.electron.updateProduct({ id: editingItem.id, updates })
                if (!res.success) throw new Error(res.error)
                updateCatalogItem(editingItem.id, updates)
            } else {
                // Create
                const newItem: CatalogItem = {
                    id: crypto.randomUUID(),
                    name: editingItem.name,
                    description: editingItem.description || '',
                    price: Number(editingItem.price),
                    inStock: editingItem.inStock ?? true,
                    tags,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
                const res = await window.electron.addProduct(newItem)
                if (!res.success) throw new Error(res.error)
                addCatalogItem(newItem)
            }
            setIsEditing(false)
            setEditingItem(null)
            setTagsInput('')
        } catch (error) {
            console.error('Failed to save product:', error)
            alert(`Failed to save product: ${error}`)
        } finally {
            setIsSaving(false)
        }
    }

    const startEdit = (item?: CatalogItem) => {
        setEditingItem(item || { name: '', description: '', price: 0, inStock: true, tags: [] })
        setTagsInput(item ? item.tags.join(', ') : '')
        setIsEditing(true)
    }

    if (isEditing) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {editingItem?.id ? 'Edit Product' : 'Add Product'}
                    </h2>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Product Name
                            </label>
                            <input
                                type="text"
                                value={editingItem?.name}
                                onChange={e => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                placeholder="e.g. Premium Widget"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Price (₦)
                            </label>
                            <input
                                type="number"
                                value={editingItem?.price}
                                onChange={e => setEditingItem(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Status
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setEditingItem(prev => ({ ...prev, inStock: true }))}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${editingItem?.inStock
                                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                                        }`}
                                >
                                    In Stock
                                </button>
                                <button
                                    onClick={() => setEditingItem(prev => ({ ...prev, inStock: false }))}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!editingItem?.inStock
                                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                                        }`}
                                >
                                    Out of Stock
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Description
                            </label>
                            <textarea
                                value={editingItem?.description}
                                onChange={e => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full h-32 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                                placeholder="Describe the product features, benefits, and key details..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tags (comma separated)
                            </label>
                            <input
                                type="text"
                                value={tagsInput}
                                onChange={e => setTagsInput(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                placeholder="electronics, gadget, sale"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50 dark:border-white/5">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Product Catalog</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your products and services for AI context</p>
                </div>
                <button
                    onClick={() => startEdit()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </header>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalog.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No products found</p>
                    </div>
                ) : (
                    filteredCatalog.map(item => (
                        <div key={item.id} className="group relative bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-brand-500/50 transition-all hover:shadow-lg">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                                        {item.name}
                                    </h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.inStock
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-rose-500/10 text-rose-600'
                                        }`}>
                                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>
                                <span className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200">
                                    ₦{item.price.toLocaleString()}
                                </span>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-10">
                                {item.description}
                            </p>

                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                {item.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-slate-200/50 dark:border-white/5">
                                <button
                                    onClick={() => startEdit(item)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete this product?')) {
                                            await window.electron.deleteProduct(item.id)
                                            removeCatalogItem(item.id)
                                        }
                                    }}
                                    className="flex items-center justify-center p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
