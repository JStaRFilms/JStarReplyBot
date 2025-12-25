import { log } from '../logger';

interface GatekeeperOptions {
    baseUrl?: string;
    licenseKey: string;
}

const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; // 4MB Limit for Vercel Serverless

export const createGatekeeper = (options: GatekeeperOptions) => {
    const baseUrl = options.baseUrl || 'http://127.0.0.1:3000/api'; // Default to local for safety

    const createModel = (modelId: string): any => {
        return {
            specificationVersion: 'v1',
            provider: 'gatekeeper',
            modelId,
            defaultObjectGenerationMode: 'json',

            async doGenerate(callOptions: any) {
                // 1. Compression / Size Check
                const estimatedSize = JSON.stringify(callOptions.prompt).length;
                if (estimatedSize > MAX_PAYLOAD_SIZE) {
                    throw new Error(`Payload too large(${(estimatedSize / 1024 / 1024).toFixed(2)}MB).Limit is 4MB.Please compress media files.`);
                }

                log('INFO', `[Gatekeeper] Routing ${modelId} via ${baseUrl} (${(estimatedSize / 1024).toFixed(2)}KB)`);

                const response = await fetch(`${baseUrl}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${options.licenseKey}`
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: callOptions.prompt, // Vercel SDK 'prompt' is the messages array
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    log('ERROR', `[Gatekeeper] Request failed: ${response.status} - ${errorText}`);
                    throw new Error(`Gatekeeper API Error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                // Construct V2 response structure
                return {
                    text: data.text,
                    finishReason: 'stop',
                    usage: {
                        promptTokens: 0,
                        completionTokens: 0
                    },
                    rawCall: { rawPrompt: callOptions.prompt, rawSettings: {} },
                    rawResponse: { headers: {} },
                    warnings: []
                };
            },

            async doStream(_callOptions: any) {
                throw new Error('Streaming not implemented for Gatekeeper Provider yet');
            }
        };
    };

    return createModel;
};
