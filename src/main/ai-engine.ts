import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { log } from './logger'
import { retrieveContext } from './knowledge-base'

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

export async function generateAIReply(
    userMessage: string,
    systemPrompt: string,
    history: { role: 'user' | 'model'; content: string }[] = []
): Promise<AIReplyResult | null> {
    try {
        // Retrieve relevant context from knowledge base (RAG)
        const context = await retrieveContext(userMessage)

        const contextBlock = context.length > 0
            ? `\n\n--- BUSINESS KNOWLEDGE ---\n${context.join('\n\n')}\n--- END KNOWLEDGE ---\n`
            : ''

        const historyBlock = history.length > 0
            ? `\n\n--- CONVERSATION HISTORY ---\n${history.map(m => `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`).join('\n')}\n--- END HISTORY ---\n`
            : ''

        const fullSystemPrompt = `${systemPrompt}
${contextBlock}
${historyBlock}

IMPORTANT INSTRUCTIONS:
1. Keep responses concise and friendly (under 200 characters if possible)
2. If you detect the user is asking about a specific product, mention it naturally
3. If the user seems frustrated (sentiment: high), be extra empathetic
4. Never admit you are an AI unless directly asked
5. Use natural, conversational language

Analyze the user's message for:
- Sentiment level (low/medium/high frustration)
- Product intent (what product/service they're asking about)

Respond with a helpful reply.`

        const result = await generateText({
            model: getGroq()('moonshotai/kimi-k2-instruct-0905'),
            system: fullSystemPrompt,
            prompt: userMessage,
            maxTokens: 300,
            temperature: 0.7
        })

        // Analyze response for sentiment and product intent
        const sentiment = detectSentiment(userMessage)
        const productIntent = detectProductIntent(userMessage)

        log('AI', `Generated reply (sentiment: ${sentiment}, product: ${productIntent || 'none'})`)

        return {
            text: result.text,
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
