import { create } from 'zustand'
import { CatalogItem } from '../../../shared/types'

interface CatalogState {
    catalog: CatalogItem[]
    isLoading: boolean
    setCatalog: (catalog: CatalogItem[]) => void
    addCatalogItem: (item: CatalogItem) => void
    updateCatalogItem: (id: string, updates: Partial<CatalogItem>) => void
    removeCatalogItem: (id: string) => void
}

export const useCatalogStore = create<CatalogState>((set) => ({
    catalog: [],
    isLoading: false,
    setCatalog: (catalog) => set({ catalog }),
    addCatalogItem: (item) => set((state) => ({ catalog: [...state.catalog, item] })),
    updateCatalogItem: (id, updates) => set((state) => ({
        catalog: state.catalog.map((item) =>
            item.id === id ? { ...item, ...updates } : item
        )
    })),
    removeCatalogItem: (id) => set((state) => ({
        catalog: state.catalog.filter((item) => item.id !== id)
    }))
}))
