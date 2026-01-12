/**
 * AI Provider Interface - รองรับหลาย AI providers
 * Providers: OpenAI, Gemini, Claude, Groq, Mock
 */

export interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AiCompletionOptions {
    messages: AiMessage[];
    maxTokens?: number;
    temperature?: number;
}

export interface AiCompletionResponse {
    content: string;
    provider: string;
    model: string;
    tokensUsed?: number;
}

export interface AiProvider {
    readonly name: string;
    readonly model: string;
    complete(options: AiCompletionOptions): Promise<AiCompletionResponse>;
    isAvailable(): boolean;
}
