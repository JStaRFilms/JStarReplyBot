import { embed } from 'ai'
import { google } from '@ai-sdk/google'

// LemonSqueezy Validation Stub (Duplicate of chat route for now, refactor later)
async function validateLicense(key: string) {
    if (process.env.NODE_ENV === 'development') return true
    // TODO: Real validation
    return true
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

        // C. Generate Embedding (Using Server-Side Master Key)
        // Note: process.env.GEMINI_API_KEY must be set in .env.local
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
