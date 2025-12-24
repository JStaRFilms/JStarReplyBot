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

import { validateLicense } from '@/lib/license.service'

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
