import { createGroq } from '@ai-sdk/groq'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { validateLicense } from '@/lib/license.service'
import { logRequest } from '@/lib/logger'

// --- Master Key Logic (Groq) ---
const GROQ_KEYS = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[]

let groqKeyIndex = 0
function getGroqKey() {
    if (GROQ_KEYS.length === 0) throw new Error('No Groq Keys configured')
    const key = GROQ_KEYS[groqKeyIndex]
    groqKeyIndex = (groqKeyIndex + 1) % GROQ_KEYS.length
    return key
}

// --- Master Key Logic (Google) ---
const GOOGLE_KEYS = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY
].filter(Boolean) as string[]

let googleKeyIndex = 0
function getGoogleKey() {
    if (GOOGLE_KEYS.length === 0) {
        // Fallback to Groq logic if no specific Google keys, 
        // but typically you need specific keys for Gemini.
        // We'll throw specific error.
        throw new Error('No Google/Gemini Keys configured')
    }
    const key = GOOGLE_KEYS[googleKeyIndex]
    googleKeyIndex = (googleKeyIndex + 1) % GOOGLE_KEYS.length
    return key
}

export async function POST(req: Request) {
    const startTime = performance.now()
    let targetModel = 'unknown'

    try {
        // A. Auth Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            logRequest({
                type: 'chat',
                status: 'fail',
                latencyMs: Math.round(performance.now() - startTime),
                error: 'Unauthorized: Missing License Key'
            })
            return new Response('Unauthorized: Missing License Key', { status: 401 })
        }

        const licenseKey = authHeader.split(' ')[1]
        const isValid = await validateLicense(licenseKey)

        if (!isValid) {
            logRequest({
                type: 'chat',
                status: 'fail',
                latencyMs: Math.round(performance.now() - startTime),
                error: 'Payment Required: Invalid License'
            })
            return new Response('Payment Required: Invalid or Expired License', { status: 402 })
        }

        // B. Parse Body
        // Expect 'messages' to be CoreMessage[] (compatible with Vercel AI SDK)
        const { messages, model } = await req.json()
        targetModel = model || 'llama-3.3-70b-versatile'

        let result;

        // C. Provider Routing
        if (targetModel.toLowerCase().startsWith('gemini')) {
            // GOOGLE / GEMINI ROUTE
            const google = createGoogleGenerativeAI({ apiKey: getGoogleKey() })

            result = await generateText({
                model: google(targetModel),
                messages: messages as any, // CoreMessage support (text + images/files)
            })

        } else {
            // GROQ ROUTE (Default)
            const groq = createGroq({ apiKey: getGroqKey() })

            result = await generateText({
                model: groq(targetModel),
                messages: messages as any,
            })
        }

        // Log Success
        logRequest({
            type: 'chat',
            status: 'ok',
            latencyMs: Math.round(performance.now() - startTime),
            model: targetModel
        })

        // D. Return JSON
        return Response.json({ text: result.text })

    } catch (error) {
        console.error('Gatekeeper Error:', error)

        logRequest({
            type: 'chat',
            status: 'fail',
            latencyMs: Math.round(performance.now() - startTime),
            model: targetModel,
            error: String(error)
        })

        // Return 500 but also log details for debugging
        return new Response(JSON.stringify({ error: 'Gatekeeper Gen Error', details: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

