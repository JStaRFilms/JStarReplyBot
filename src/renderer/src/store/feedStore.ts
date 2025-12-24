import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { QueueProcessedEvent } from '../../../shared/types'

interface FeedState {
    events: QueueProcessedEvent[]
    addEvent: (event: QueueProcessedEvent) => void
    clearFeed: () => void
}

export const useFeedStore = create<FeedState>()(
    persist(
        (set) => ({
            events: [],
            addEvent: (event) => set((state) => {
                // Prevent duplicates if needed, or just append
                // Keep last 50 events
                return { events: [...state.events.slice(-49), event] }
            }),
            clearFeed: () => set({ events: [] })
        }),
        {
            name: 'jstar-feed-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
)
