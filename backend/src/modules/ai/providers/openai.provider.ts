import { AiProvider, AiCompletionOptions, AiCompletionResponse } from './ai-provider.interface';

/**
 * OpenAI Provider (GPT-3.5, GPT-4)
 */
export class OpenAiProvider implements AiProvider {
    readonly name = 'openai';
    readonly model: string;
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.openai.com/v1/chat/completions';

    constructor(apiKey: string, model: string = 'gpt-3.5-turbo') {
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
            throw new Error(`OpenAI API error: ${error}`);
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
