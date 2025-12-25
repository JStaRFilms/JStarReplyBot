import { embed } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { validateLicense } from '@/lib/license.service'

// --- Master Key Logic (Google) ---
const GOOGLE_KEYS = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY
].filter(Boolean) as string[]

let googleKeyIndex = 0
function getGoogleKey() {
    if (GOOGLE_KEYS.length === 0) {
        throw new Error('No Google/Gemini Keys configured')
    }
    const key = GOOGLE_KEYS[googleKeyIndex]
    googleKeyIndex = (googleKeyIndex + 1) % GOOGLE_KEYS.length
    return key
}

export async function POST(req: Request) {
    try {
        // A. Auth Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response('Unauthorized', { status: 401 })
        }
        const licenseKey = authHeader.split(' ')[1]
        if (!(await validateLicense(licenseKey))) {
            return new Response('Payment Required', { status: 402 })
        }

        // B. Parse Body
        const { value } = await req.json()
        if (!value) return new Response('Missing value', { status: 400 })

        // C. Generate Embedding
        const google = createGoogleGenerativeAI({ apiKey: getGoogleKey() })

        const { embedding } = await embed({
            model: google.textEmbeddingModel('text-embedding-004'),
            value: value,
        })

        // D. Return JSON
        return Response.json({ embedding })

    } catch (error) {
        console.error('Embedding Error:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}
