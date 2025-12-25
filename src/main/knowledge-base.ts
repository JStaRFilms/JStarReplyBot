import { app } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { log } from './logger'
import { addDocument, removeDocument, getDocuments } from './db'
import type { KnowledgeDocument, CatalogItem } from '../shared/types'

// Configuration constants
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004'

// LanceDB will be dynamically imported (ESM module)
let lancedb: typeof import('@lancedb/lancedb') | null = null
let db: Awaited<ReturnType<typeof import('@lancedb/lancedb')['connect']>> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let table: any = null

// Lazy-initialized after dotenv loads
let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
        if (!apiKey) {
            const error = 'Gemini API key is required. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local'
            log('ERROR', error)
            throw new Error(error)
        }
        // Log without exposing the key
        log('INFO', 'Gemini API key loaded successfully')
        genAI = new GoogleGenerativeAI(apiKey)
    }
    return genAI
}

interface VectorRecord {
    id: string
    text: string
    vector: number[]
    documentId: string
}

async function initLanceDB(): Promise<void> {
    if (db) return

    try {
        lancedb = await import('@lancedb/lancedb')
        const userDataPath = app.getPath('userData')
        const vectorsPath = join(userDataPath, 'vectors')

        db = await lancedb.connect(vectorsPath)

        // Try to open existing table or create new one
        try {
            table = await db.openTable('knowledge')
        } catch {
            // Table doesn't exist, will be created on first document
            log('INFO', 'Knowledge table will be created on first document')
        }

        log('INFO', 'LanceDB initialized')
    } catch (error) {
        log('ERROR', `Failed to initialize LanceDB: ${error}`)
    }
}

async function getEmbedding(text: string): Promise<number[]> {
    // Guard against empty text (causes 400 errors on Gatekeeper)
    if (!text || text.trim().length === 0) {
        log('WARN', 'Skipping embedding for empty text')
        return []
    }

    const { getSettings } = await import('./db')
    const settings = await getSettings()

    // 1. Try Gatekeeper (Proxy) if Licensed
    if (settings.licenseStatus === 'active' && settings.licenseKey) {
        try {
            const baseUrl = process.env.GATEKEEPER_URL || 'http://127.0.0.1:3000/api'
            // Ensure we don't double-up if legacy env var is used
            const cleanBase = baseUrl.replace(/\/chat$/, '')
            const GATEKEEPER_EMBED_URL = `${cleanBase}/embed`
            const response = await fetch(GATEKEEPER_EMBED_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.licenseKey}`
                },
                body: JSON.stringify({ value: text })
            })

            if (response.ok) {
                const data = await response.json()
                return data.embedding
            }
            log('WARN', `Gatekeeper embed failed (${response.status}), falling back to local key`)
        } catch (error) {
            log('ERROR', `Gatekeeper embed error: ${error}`)
        }
    }

    // 2. Fallback to Local Gemini Key
    const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
    const model = getGenAI().getGenerativeModel({ model: embeddingModel })
    const result = await model.embedContent(text)
    return result.embedding.values
}

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length)
        chunks.push(text.slice(start, end))
        start = end - overlap
        if (start < 0) start = 0
        if (end === text.length) break
    }

    return chunks
}

export async function indexDocument(
    filePath: string,
    fileName: string,
    fileType: 'pdf' | 'txt' | 'md'
): Promise<KnowledgeDocument | null> {
    await initLanceDB()

    try {
        log('INFO', `Indexing document: ${fileName}`)

        // Read file content
        let content: string
        if (fileType === 'pdf') {
            // PDF parsing
            const pdfParse = await import('pdf-parse')
            const buffer = await readFile(filePath)
            const pdf = await pdfParse.default(buffer)
            content = pdf.text
        } else {
            content = await readFile(filePath, 'utf-8')
        }

        // Chunk the content
        const chunks = chunkText(content)
        log('INFO', `Split into ${chunks.length} chunks`)

        // Generate embeddings for each chunk
        const documentId = `doc_${Date.now()}`
        const records: VectorRecord[] = []

        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i]
            if (!chunkText) continue
            const vector = await getEmbedding(chunkText)
            records.push({
                id: `${documentId}_chunk_${i}`,
                text: chunkText,
                vector,
                documentId
            })

            // Rate limit for Gemini API
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200))
            }
        }

        // Store in LanceDB
        if (!table && db) {
            table = await db.createTable('knowledge', records as unknown as Record<string, unknown>[])
        } else if (table) {
            await table.add(records)
        }

        // Add to LowDB catalog (with filePath for reindexing)
        const doc: KnowledgeDocument = {
            id: documentId,
            name: fileName,
            type: fileType,
            sizeBytes: content.length,
            vectorCount: chunks.length,
            indexedAt: Date.now(),
            filePath // Store for reindexing
        }

        await addDocument(doc)
        log('INFO', `Document indexed: ${fileName} (${chunks.length} vectors)`)

        return doc

    } catch (error) {
        log('ERROR', `Failed to index document: ${error}`)
        return null
    }
}

export async function indexCatalogItem(item: CatalogItem): Promise<boolean> {
    await initLanceDB()

    try {
        log('INFO', `Indexing product: ${item.name}`)

        // Create a rich text representation for embedding
        const text = `Product: ${item.name}
Price: $${item.price}
Description: ${item.description}
Tags: ${item.tags.join(', ')}
${item.inStock ? 'In Stock' : 'Out of Stock'}`

        const embedding = await getEmbedding(text)

        const record: VectorRecord = {
            id: `prod_${item.id}`,
            text,
            vector: embedding,
            documentId: `prod_${item.id}` // Reuse documentId field for product ID
        }

        // Store in LanceDB
        if (!table && db) {
            table = await db.createTable('knowledge', [record] as any)
        } else if (table) {
            // Remove existing if any (overwrite)
            await deleteCatalogItem(item.id)
            await table.add([record])
        }

        log('INFO', `Product indexed: ${item.name}`)
        return true

    } catch (error) {
        log('ERROR', `Failed to index product: ${error}`)
        return false
    }
}

export async function deleteCatalogItem(id: string): Promise<boolean> {
    await initLanceDB()
    if (!table) return false

    try {
        // Delete where documentId = prod_{id}
        await table.delete(`"documentId" = 'prod_${id}'`)
        return true
    } catch (error) {
        log('ERROR', `Failed to delete product vectors: ${error}`)
        return false
    }
}

export async function deleteDocument(documentId: string): Promise<boolean> {
    await initLanceDB()

    try {
        // Remove from LanceDB
        if (table) {
            await table.delete(`"documentId" = '${documentId}'`)
        }

        // Remove from LowDB
        await removeDocument(documentId)

        log('INFO', `Document deleted: ${documentId}`)
        return true

    } catch (error) {
        log('ERROR', `Failed to delete document: ${error}`)
        return false
    }
}

export async function retrieveContext(query: string, topK = 3): Promise<string[]> {
    await initLanceDB()

    if (!table) {
        return []
    }

    try {
        const queryVector = await getEmbedding(query)

        const results = await table
            .vectorSearch(queryVector)
            .limit(topK)
            .toArray()

        return results.map((r: { text: string }) => r.text)

    } catch (error) {
        log('ERROR', `Failed to retrieve context: ${error}`)
        return []
    }
}

export async function reindexDocument(documentId: string): Promise<boolean> {
    const docs = await getDocuments()
    const doc = docs.find(d => d.id === documentId)

    if (!doc) {
        log('ERROR', `Document not found: ${documentId}`)
        return false
    }

    // Check for file path (required for proper reindexing)
    if (!doc.filePath) {
        log('ERROR', `Document ${documentId} is missing filePath, cannot reindex`)
        return false
    }

    // Verify the file still exists on disk
    if (!existsSync(doc.filePath)) {
        log('ERROR', `Source file no longer exists: ${doc.filePath}`)
        return false
    }

    // Delete old vectors and re-index from file
    try {
        await deleteDocument(documentId)
        const newDoc = await indexDocument(doc.filePath, doc.name, doc.type)
        if (newDoc) {
            log('INFO', `Document reindexed: ${doc.name}`)
            return true
        }
        return false
    } catch (error) {
        log('ERROR', `Failed to reindex document: ${error}`)
        return false
    }
}

export { getDocuments }
