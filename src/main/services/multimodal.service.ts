import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { log } from '../logger'

// Lazy init
let google: ReturnType<typeof createGoogleGenerativeAI> | null = null

function getGoogle() {
    if (!google) {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
        if (!apiKey) {
            log('WARN', 'No GEMINI_API_KEY found. Multimodal features will fail.')
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
        const googleProvider = getGoogle()
        if (!googleProvider) {
            log('WARN', 'Google AI provider not initialized')
            return null
        }
        const model = googleProvider('gemini-2.5-flash-lite')

        // Clean MIME type (Gemini dislikes params like ; codecs=opus)
        const cleanMime = (mimeType.split(';')[0] || mimeType).trim()

        let prompt = ''
        if (mode === 'audio') {
            prompt = 'Transcribe this audio message exactly as spoken. If it contains a question or request, summarize the intent at the end in brackets [Intent: ...].'
        } else if (mode === 'video') {
            prompt = 'Describe this video. If there is speech, transcribe it. If there is visual action, describe it naturally.'
        } else {
            prompt = 'Describe the content of this image naturally. If there is text, transcribe it. If there are products, list them. Do not describe the image as an "file" or "attachment", just describe what is IN it.'
        }

        // Construct STRICT strictly typed CoreUserMessage content
        // @ai-sdk/google expects 'file' parts for audio/video and 'image' parts for images
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

        const result = await generateText({
            model: model as any,
            messages: [
                {
                    role: 'user',
                    content
                }
            ]
        })

        const output = result.text
        log('AI', `[Multimodal] ${mode} analysis: ${output.substring(0, 50)}...`)
        return output

    } catch (error) {
        log('ERROR', `Multimodal analysis failed (${mode}): ${error}`)
        return null
    }
}
