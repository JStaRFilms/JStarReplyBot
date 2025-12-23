import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { z } from 'zod'

// 1. Master Key Rotation Logic
// In a real app, you might pull this from a database or Redis
const MASTER_KEYS = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[]

let keyIndex = 0

function getNextMasterKey() {
    if (MASTER_KEYS.length === 0) throw new Error('No Master Keys configured on Gatekeeper')
    const key = MASTER_KEYS[keyIndex]
    keyIndex = (keyIndex + 1) % MASTER_KEYS.length
    return key
}

// 2. LemonSqueezy Validation Stub
async function validateLicense(key: string) {
    // For MVP, we can just check if it fits a pattern or hit the API
    // If you want to enable real LS validation server-side:
    /*
    const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key })
    })
    const data = await res.json()
    return data.valid
    */

    // DEV MODE: Allow anything starting with "TEST-"
    if (process.env.NODE_ENV === 'development') return true

    // TODO: Enable real validation
    return true
}

export async function POST(req: Request) {
    try {
        // A. Auth Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response('Unauthorized: Missing License Key', { status: 401 })
        }

        const licenseKey = authHeader.split(' ')[1]
        const isValid = await validateLicense(licenseKey)

        if (!isValid) {
            return new Response('Payment Required: Invalid or Expired License', { status: 402 })
        }

        // B. Parse Body
        const { messages, model } = await req.json()

        // C. Select Master Key (Rotation)
        const masterKey = getNextMasterKey()
        const groq = createGroq({ apiKey: masterKey })

        // D. Proxy Request (Blocking/JSON for now, matching Electron App expectation)
        const result = await generateText({
            model: groq(model || 'llama-3.3-70b-versatile'),
            messages: messages as any,
        })

        // E. Return JSON
        return Response.json({ text: result.text })

    } catch (error) {
        console.error('Gatekeeper Error:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}
