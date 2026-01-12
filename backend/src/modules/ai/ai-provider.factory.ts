import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    AiProvider,
    OpenAiProvider,
    GeminiProvider,
    ClaudeProvider,
    GroqProvider,
    MockProvider,
} from './providers';

export type AiProviderType = 'openai' | 'gemini' | 'claude' | 'groq' | 'mock';

// รายการ models ที่รองรับแต่ละ provider
export const AVAILABLE_MODELS: Record<AiProviderType, { value: string; label: string; desc: string }[]> = {
    openai: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: 'เร็ว ราคาถูก' },
        { value: 'gpt-4', label: 'GPT-4', desc: 'ฉลาดมาก แต่แพง' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'เร็วกว่า GPT-4' },
        { value: 'gpt-4o', label: 'GPT-4o', desc: 'รุ่นใหม่ล่าสุด' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'ราคาถูก คุณภาพดี' },
    ],
    gemini: [
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'เร็วมาก ฟรี!' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'ฉลาดกว่า' },
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', desc: 'รุ่นใหม่ล่าสุด' },
    ],
    claude: [
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', desc: 'เร็ว ราคาถูก' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', desc: 'สมดุล' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', desc: 'ฉลาดที่สุด' },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', desc: 'รุ่นใหม่' },
    ],
    groq: [
        { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B', desc: 'ฉลาด ฟรี!' },
        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', desc: 'เร็วมาก ฟรี!' },
        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', desc: 'รุ่นใหม่' },
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', desc: 'Mistral AI' },
        { value: 'gemma2-9b-it', label: 'Gemma 2 9B', desc: 'Google Gemma' },
    ],
    mock: [
        { value: 'mock-v1', label: 'Mock v1', desc: 'ข้อมูลจำลอง' },
    ],
};

/**
 * AI Provider Factory - สร้าง provider ตามที่ตั้งค่าใน .env
 */
@Injectable()
export class AiProviderFactory {
    private providers: Map<AiProviderType, AiProvider> = new Map();
    private currentProvider: AiProviderType;
    private currentModels: Map<AiProviderType, string> = new Map();
    private apiKeys: Map<AiProviderType, string> = new Map();

    constructor(private configService: ConfigService) {
        this.initializeProviders();
        this.currentProvider = (this.configService.get<string>('AI_PROVIDER') || 'mock') as AiProviderType;
    }

    private initializeProviders(): void {
        // OpenAI
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
        const openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
        if (openaiKey) {
            this.apiKeys.set('openai', openaiKey);
            this.currentModels.set('openai', openaiModel);
            this.providers.set('openai', new OpenAiProvider(openaiKey, openaiModel));
        }

        // Gemini
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        const geminiModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
        if (geminiKey) {
            this.apiKeys.set('gemini', geminiKey);
            this.currentModels.set('gemini', geminiModel);
            this.providers.set('gemini', new GeminiProvider(geminiKey, geminiModel));
        }

        // Claude
        const claudeKey = this.configService.get<string>('CLAUDE_API_KEY');
        const claudeModel = this.configService.get<string>('CLAUDE_MODEL') || 'claude-3-haiku-20240307';
        if (claudeKey) {
            this.apiKeys.set('claude', claudeKey);
            this.currentModels.set('claude', claudeModel);
            this.providers.set('claude', new ClaudeProvider(claudeKey, claudeModel));
        }

        // Groq
        const groqKey = this.configService.get<string>('GROQ_API_KEY');
        const groqModel = this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-70b-versatile';
        if (groqKey) {
            this.apiKeys.set('groq', groqKey);
            this.currentModels.set('groq', groqModel);
            this.providers.set('groq', new GroqProvider(groqKey, groqModel));
        }

        // Mock (always available)
        this.currentModels.set('mock', 'mock-v1');
        this.providers.set('mock', new MockProvider());
    }

    /**
     * ดึง provider ปัจจุบัน
     */
    getProvider(): AiProvider {
        const provider = this.providers.get(this.currentProvider);
        if (!provider || !provider.isAvailable()) {
            console.warn(`Provider ${this.currentProvider} not available, falling back to mock`);
            return this.providers.get('mock')!;
        }
        return provider;
    }

    /**
     * ดึง provider ตามชื่อ
     */
    getProviderByName(name: AiProviderType): AiProvider | undefined {
        return this.providers.get(name);
    }

    /**
     * เปลี่ยน provider
     */
    setProvider(name: AiProviderType): void {
        if (this.providers.has(name) || name === 'mock') {
            this.currentProvider = name;
        }
    }

    /**
     * เปลี่ยน model ของ provider
     */
    setModel(providerName: AiProviderType, modelName: string): boolean {
        const models = AVAILABLE_MODELS[providerName];
        if (!models?.find(m => m.value === modelName)) {
            return false;
        }

        const apiKey = this.apiKeys.get(providerName);
        if (!apiKey && providerName !== 'mock') {
            return false;
        }

        this.currentModels.set(providerName, modelName);

        // Recreate provider with new model
        switch (providerName) {
            case 'openai':
                this.providers.set('openai', new OpenAiProvider(apiKey!, modelName));
                break;
            case 'gemini':
                this.providers.set('gemini', new GeminiProvider(apiKey!, modelName));
                break;
            case 'claude':
                this.providers.set('claude', new ClaudeProvider(apiKey!, modelName));
                break;
            case 'groq':
                this.providers.set('groq', new GroqProvider(apiKey!, modelName));
                break;
        }

        return true;
    }

    /**
     * ดึงรายชื่อ providers ที่ใช้งานได้
     */
    getAvailableProviders(): { name: string; model: string; models: typeof AVAILABLE_MODELS['openai']; available: boolean }[] {
        const allProviders: { name: AiProviderType; label: string }[] = [
            { name: 'openai', label: 'OpenAI' },
            { name: 'gemini', label: 'Google Gemini' },
            { name: 'claude', label: 'Anthropic Claude' },
            { name: 'groq', label: 'Groq' },
            { name: 'mock', label: 'Mock (Development)' },
        ];

        return allProviders.map(p => {
            const provider = this.providers.get(p.name);
            return {
                name: p.name,
                model: this.currentModels.get(p.name) || AVAILABLE_MODELS[p.name][0].value,
                models: AVAILABLE_MODELS[p.name],
                available: provider?.isAvailable() || p.name === 'mock',
            };
        });
    }

    /**
     * ดึงชื่อ provider ปัจจุบัน
     */
    getCurrentProviderName(): string {
        return this.currentProvider;
    }

    /**
     * ดึง model ปัจจุบันของ provider
     */
    getCurrentModel(): string {
        return this.currentModels.get(this.currentProvider) || 'mock-v1';
    }
}

