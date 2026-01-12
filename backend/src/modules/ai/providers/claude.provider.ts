import { AiProvider, AiCompletionOptions, AiCompletionResponse } from './ai-provider.interface';

/**
 * Anthropic Claude Provider
 */
export class ClaudeProvider implements AiProvider {
    readonly name = 'claude';
    readonly model: string;
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.anthropic.com/v1/messages';

    constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
        this.apiKey = apiKey;
        this.model = model;
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async complete(options: AiCompletionOptions): Promise<AiCompletionResponse> {
        // Extract system message
        const systemMessage = options.messages.find(m => m.role === 'system');
        const messages = options.messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }));

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: options.maxTokens || 1000,
                system: systemMessage?.content,
                messages,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text,
            provider: this.name,
            model: this.model,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
        };
    }
}
