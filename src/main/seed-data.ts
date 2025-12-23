import type { CatalogItem, Settings } from '../shared/types'
import { v4 as uuidv4 } from 'uuid'

export const SEED_PROFILE = {
    name: "James's Bistro & Motors",
    industry: "Hybrid Hospitality & Automotive",
    targetAudience: "Hungry drivers and people who need a ride to dinner",
    tone: "friendly" as const,
    description: "We solve two problems: Empty stomachs and walking. Get a delicious meal while you wait for your paperwork. The only place where you can buy a Benz and a bowl of Pepper Soup at the same time."
}

export const SEED_CATALOG: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // === FOOD ===
    {
        name: "Smoky Jollof Rice (Basmati)",
        description: "Party style jollof rice with fried plantain and peppered turkey. The smoke will wake your ancestors.",
        price: 4500,
        inStock: true,
        tags: ["food", "rice", "lunch"]
    },
    {
        name: "Eba & Egusi Soup (Assorted)",
        description: "Yellow garri with rich egusi soup containing shaki, beef, and dry fish. Finger licking goodness.",
        price: 3500,
        inStock: true,
        tags: ["food", "swallow", "local"]
    },
    {
        name: "Asun (Spicy Goat Meat)",
        description: "Peppered goat meat chopped into bite-sized pieces. Warning: Very spicy.",
        price: 5000,
        inStock: true,
        tags: ["food", "sides", "spicy"]
    },
    {
        name: "CWAY Water Dispenser refill",
        description: "19L Refill bottle. Cold water for the hot weather.",
        price: 1500,
        inStock: true,
        tags: ["drinks", "water"]
    },

    // === CARS ===
    {
        name: "Toyota Corolla 2010 (Bank Manager Spec)",
        description: "Clean title, Lagos cleared. Ice cold AC, nothing to fix. Buy and drive.",
        price: 4500000,
        inStock: true,
        tags: ["cars", "sedan", "toyota"]
    },
    {
        name: "Lexus RX350 2017 (Full Option)",
        description: "Panoramic roof, leather seats, reverse camera. Low mileage. Tokunbo standard.",
        price: 28000000,
        inStock: true,
        tags: ["cars", "suv", "luxury"]
    },
    {
        name: "Mercedes Benz C300 2016",
        description: "Foreign used, accident free. Black on black interior. Pop and bang kit included (optional).",
        price: 22000000,
        inStock: false,
        tags: ["cars", "sedan", "luxury"]
    }
]

export function generateSeedData(): {
    catalog: CatalogItem[],
    profile: Partial<Settings['businessProfile']>,
    settings: Partial<Settings>
} {
    const catalog = SEED_CATALOG.map(item => ({
        ...item,
        id: uuidv4(),
        createdAt: Date.now(),
        updatedAt: Date.now()
    }))

    return {
        catalog,
        profile: SEED_PROFILE,
        settings: {
            botName: 'JStar',
            currency: '₦'
        }
    }
}
