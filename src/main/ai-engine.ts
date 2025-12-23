import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { log } from './logger'
import { retrieveContext } from './knowledge-base'
import { getSettings, getCatalog } from './db'

// Lazy-initialized after dotenv loads
let groq: ReturnType<typeof createGroq> | null = null

function getGroq() {
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY || ''
        if (!apiKey) {
            log('WARN', 'No GROQ_API_KEY found in .env.local')
        } else {
            log('INFO', `Groq API key loaded (${apiKey.substring(0, 8)}...)`)
        }
        groq = createGroq({ apiKey })
    }
    return groq
}

interface AIReplyResult {
    text: string
    sentiment: 'low' | 'medium' | 'high'
    productIntent?: string
}

const GATEKEEPER_API_URL = process.env.GATEKEEPER_URL || 'http://127.0.0.1:3000/api/chat'

export async function generateAIReply(
    userMessage: string,
    systemPrompt: string,
    history: { role: 'user' | 'model'; content: string }[] = []
): Promise<AIReplyResult | null> {
    try {
        // Retrieve relevant context from knowledge base (RAG)
        const context = await retrieveContext(userMessage)

        // Retrieve Settings (for Profile + Currency)
        const settings = await getSettings()
        const { botName, currency, licenseKey, licenseStatus } = settings
        const profile = settings.businessProfile

        // Retrieve Catalog (Lite Index)
        const catalog = await getCatalog()
        const catalogBlock = catalog.length > 0
            ? `\n\n--- PRODUCT CATALOG ---\n${catalog.map(c => `- ${c.name} (${currency}${c.price.toLocaleString()}): ${c.inStock ? 'In Stock' : 'Out of Stock'}`).join('\n')}\n--- END CATALOG ---\n`
            : ''

        const contextBlock = context.length > 0
            ? `\n\n--- BUSINESS KNOWLEDGE ---\n${context.join('\n\n')}\n--- END KNOWLEDGE ---\n`
            : ''

        // Retrieve Business Profile
        const profileBlock = `
You are ${botName}, a helpful AI assistant working for ${profile.name || 'our business'}.
Industry: ${profile.industry || 'General'}
Target Audience: ${profile.targetAudience}
Tone: ${profile.tone}
${profile.description}`

        const historyBlock = history.length > 0
            ? `\n\n--- CONVERSATION HISTORY ---\n${history.map(m => `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`).join('\n')}\n--- END HISTORY ---\n`
            : ''

        const fullSystemPrompt = `${systemPrompt}
${profileBlock}
${catalogBlock}
${contextBlock}
${historyBlock}

IMPORTANT INSTRUCTIONS:
1. Your name is ${botName}. You are NOT the business owner, you work for them.
2. ALWAYS use ${currency} for currency (e.g. ${currency}1,000). Never use '$' unless explicitly asked.
3. STRICTLY ADHERE TO THE PRODUCT CATALOG. Do not invent products or sell items mentioned in the generic description unless they explicitly appear in the CATALOG list.
4. If a user asks for a product not in the catalog, politely say you don't have it and offer an alternative from the catalog.
5. Keep responses concise and friendly (under 200 characters if possible)
6. If you detect the user is asking about a specific product, mention it naturally
7. If the user seems frustrated (sentiment: high), be extra empathetic
8. Never admit you are an AI unless directly asked
9. Use natural, conversational language
10. Match the specified Tone (${profile.tone}) in your writing style.

Analyze the user's message for:
- Sentiment level (low/medium/high frustration)
- Product intent (what product/service they're asking about)

Respond with a helpful reply.`

        // BRANCH: Licensing Gatekeeper vs Local Dev
        let textResponse = ''

        if (licenseStatus === 'active' && licenseKey) {
            log('INFO', `Routing request via Gatekeeper: ${GATEKEEPER_API_URL}`)
            const response = await fetch(GATEKEEPER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${licenseKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile', // Gatekeeper can override this
                    messages: [
                        { role: 'system', content: fullSystemPrompt },
                        { role: 'user', content: userMessage }
                    ]
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                log('ERROR', `Gatekeeper request failed: ${response.status} ${response.statusText} - ${errorText}`)
                throw new Error(`Gatekeeper error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            textResponse = data.text || data.choices?.[0]?.message?.content || ''

        } else {
            // Fallback to Local Env Key (Dev Mode)
            log('INFO', 'Using local Groq API (Dev/Trial Mode)')
            const result = await generateText({
                model: getGroq()('moonshotai/kimi-k2-instruct-0905'), // Use defaults
                system: fullSystemPrompt,
                prompt: userMessage,
                maxTokens: 300,
                temperature: 0.7
            })
            textResponse = result.text
        }

        // Analyze response for sentiment and product intent
        const sentiment = detectSentiment(userMessage)
        const productIntent = detectProductIntent(userMessage)

        log('AI', `Generated reply (sentiment: ${sentiment}, product: ${productIntent || 'none'})`)

        return {
            text: textResponse,
            sentiment,
            productIntent
        }

    } catch (error) {
        log('ERROR', `AI generation failed: ${error}`)
        return null
    }
}

function detectSentiment(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase()

    const highIndicators = ['urgent', 'angry', 'frustrated', 'terrible', 'worst', 'hate', 'ridiculous', 'unacceptable', 'immediately', '!!!']
    const mediumIndicators = ['disappointed', 'confused', 'waiting', 'problem', 'issue', 'wrong', 'late', 'delayed']

    if (highIndicators.some(indicator => lowerText.includes(indicator))) {
        return 'high'
    }

    if (mediumIndicators.some(indicator => lowerText.includes(indicator))) {
        return 'medium'
    }

    return 'low'
}

function detectProductIntent(text: string): string | undefined {
    // Simple keyword extraction - in production, use NER or AI tool call
    const productPatterns = [
        /(?:about|buy|purchase|order|price of|cost of|interested in)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/i,
        /(?:your|the)\s+(\w+(?:\s+\w+)?)\s+(?:product|service|plan|package)/i
    ]

    for (const pattern of productPatterns) {
        const match = text.match(pattern)
        if (match?.[1]) {
            return match[1].trim()
        }
    }

    return undefined
}

export async function analyzeMessageForLead(
    message: string,
    _reply: string
): Promise<{ isLead: boolean; product?: string }> {
    // FR-013: Product Intent Detection
    // Check if the conversation indicates a potential lead

    const buyingSignals = ['interested', 'buy', 'purchase', 'order', 'how much', 'price', 'cost', 'available', 'stock']
    const lowerMessage = message.toLowerCase()

    const hasSignal = buyingSignals.some(signal => lowerMessage.includes(signal))
    const product = detectProductIntent(message)

    if (hasSignal && product) {
        log('INFO', `Lead detected for product: ${product}`)
        return { isLead: true, product }
    }

    return { isLead: false }
}
