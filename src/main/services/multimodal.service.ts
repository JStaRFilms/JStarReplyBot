import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { log } from '../logger'
import { getSettings } from '../db'

// Lazy init for Local Fallback
let google: ReturnType<typeof createGoogleGenerativeAI> | null = null

function getGoogle() {
    if (!google) {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
        if (!apiKey) {
            log('WARN', 'No GEMINI_API_KEY found (Local Dev). Multimodal features may fail if not licensed.')
        }
        google = createGoogleGenerativeAI({ apiKey })
    }
    return google
}

export type MediaType = 'audio' | 'image' | 'video'

export async function analyzeMedia(
    mode: MediaType,
    base64Data: string,
    mimeType: string
): Promise<string | null> {
    try {
        const settings = await getSettings()
        const { licenseKey, licenseStatus } = settings

        // Clean MIME type (Gemini dislikes params like ; codecs=opus)
        const cleanMime = (mimeType.split(';')[0] || mimeType).trim()

        let prompt = ''
        if (mode === 'audio') {
            prompt = 'Transcribe this audio message exactly as spoken. If it contains a question or request, summarize the intent at the end in brackets [Intent: ...].'
        } else if (mode === 'video') {
            prompt = 'Describe this video. If there is speech, transcribe it. If there is visual action, describe it naturally.'
        } else {
            prompt = `Analyze this image for conversational context. Your task is to help me respond appropriately in a chat.

First, identify the IMAGE TYPE:
- MEME: A joke/relatable image shared for humor or mood (e.g., reaction images, funny screenshots, relatable content)
- PRODUCT: A product photo or screenshot (e.g., someone asking about an item)
- SCREENSHOT: A screenshot of text/conversation/app
- SELFIE: A personal photo
- OTHER: Anything else

Then provide:
1. [TYPE]: One of the above
2. [INTENT]: Why was this shared? (e.g., "sharing a joke", "asking about availability", "showing off")
3. [CONTEXT]: If it's a meme/joke, what's the humor? If it's a product, what is it? If there's text, transcribe it.

Be concise. Focus on INTENT over literal visual description.`
        }

        // Construct content array for Google SDK
        const content: any[] = [{ type: 'text', text: prompt }]

        if (mode === 'image') {
            content.push({
                type: 'image',
                image: base64Data
            })
        } else {
            // Audio and Video use 'file' type
            content.push({
                type: 'file',
                data: base64Data,
                mimeType: cleanMime
            })
        }

        log('DEBUG', `[Multimodal] Sending payload: ${cleanMime} (${base64Data.length} chars)`)

        let output = ''

        // BRANCH: Licensed -> Gatekeeper via fetch | Unlicensed -> Local Google
        if (licenseStatus === 'active' && licenseKey) {
            log('INFO', '[Multimodal] Using Gatekeeper (Licensed) via fetch')
            const GATEKEEPER_URL = process.env.GATEKEEPER_URL || 'http://127.0.0.1:3000/api'

            try {
                const response = await fetch(`${GATEKEEPER_URL}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${licenseKey}`
                    },
                    body: JSON.stringify({
                        model: 'gemini-2.5-flash-lite',
                        messages: [
                            { role: 'user', content }
                        ]
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    log('ERROR', `[Multimodal] Gatekeeper request failed: ${response.status} - ${errorText}`)
                    throw new Error(`Gatekeeper Error: ${response.status}`)
                }

                const data = await response.json()
                output = data.text || ''

            } catch (gkError) {
                log('ERROR', `[Multimodal] Gatekeeper call failed: ${gkError}. Falling back to local Google.`)
                // Fallback to local Google on Gatekeeper failure
                const googleProvider = getGoogle()
                if (!googleProvider) {
                    log('WARN', 'Google AI provider not initialized for local fallback')
                    return null
                }
                const result = await generateText({
                    model: googleProvider('gemini-2.5-flash-lite'),
                    messages: [{ role: 'user' as const, content }]
                })
                output = result.text
            }

        } else {
            // Local Fallback
            const googleProvider = getGoogle()
            if (!googleProvider) {
                log('WARN', 'Google AI provider not initialized for local fallback')
                return null
            }
            const result = await generateText({
                model: googleProvider('gemini-2.5-flash-lite'),
                messages: [{ role: 'user' as const, content }]
            })
            output = result.text
        }

        log('AI', `[Multimodal] ${mode.toUpperCase()} Analysis Result:\n${output}`)
        return output

    } catch (error) {
        log('ERROR', `Multimodal analysis failed (${mode}): ${error}`)
        return null
    }
}
