import { AiProvider, AiCompletionOptions, AiCompletionResponse } from './ai-provider.interface';

/**
 * Groq Provider (ฟรี! เร็วมาก)
 * รองรับ Llama, Mixtral, Gemma
 */
export class GroqProvider implements AiProvider {
    readonly name = 'groq';
    readonly model: string;
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

    constructor(apiKey: string, model: string = 'llama-3.1-70b-versatile') {
        this.apiKey = apiKey;
        this.model = model;
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async complete(options: AiCompletionOptions): Promise<AiCompletionResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: options.messages,
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            provider: this.name,
            model: this.model,
            tokensUsed: data.usage?.total_tokens,
        };
    }
}
