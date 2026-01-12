import { AiProvider, AiCompletionOptions, AiCompletionResponse } from './ai-provider.interface';

/**
 * Google Gemini Provider (ฟรี!)
 */
export class GeminiProvider implements AiProvider {
    readonly name = 'gemini';
    readonly model: string;
    private readonly apiKey: string;

    constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async complete(options: AiCompletionOptions): Promise<AiCompletionResponse> {
        const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        // Convert messages to Gemini format
        const contents = options.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

        // Add system instruction if present
        const systemMessage = options.messages.find(m => m.role === 'system');

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                systemInstruction: systemMessage ? {
                    parts: [{ text: systemMessage.content }],
                } : undefined,
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${error}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            content,
            provider: this.name,
            model: this.model,
            tokensUsed: data.usageMetadata?.totalTokenCount,
        };
    }
}
