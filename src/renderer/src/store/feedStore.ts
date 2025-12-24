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
                const newEvents = [event, ...state.events]
                // Keep last 50, sorted by timestamp descending
                return {
                    events: newEvents
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 50)
                }
            }),
            clearFeed: () => set({ events: [] })
        }),
        {
            name: 'jstar-feed-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
)
