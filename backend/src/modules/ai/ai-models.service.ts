import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ModelInfo {
    id: string;
    name: string;
    description?: string;
    context?: number;
    pricing?: string;
}

/**
 * Service สำหรับดึงรายการ models จาก AI Provider APIs
 */
@Injectable()
export class AiModelsService {
    constructor(private configService: ConfigService) { }

    /**
     * ดึง models จาก OpenAI API
     */
    async getOpenAIModels(): Promise<ModelInfo[]> {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) return this.getDefaultOpenAIModels();

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });

            if (!response.ok) {
                console.warn('Failed to fetch OpenAI models, using defaults');
                return this.getDefaultOpenAIModels();
            }

            const data = await response.json();

            // Filter only chat models (gpt-*)
            const chatModels = data.data
                .filter((m: any) => m.id.startsWith('gpt-') && !m.id.includes('instruct'))
                .map((m: any) => ({
                    id: m.id,
                    name: this.formatModelName(m.id),
                    description: this.getModelDescription('openai', m.id),
                }))
                .sort((a: any, b: any) => b.id.localeCompare(a.id));

            return chatModels.length > 0 ? chatModels : this.getDefaultOpenAIModels();
        } catch (error) {
            console.error('Error fetching OpenAI models:', error);
            return this.getDefaultOpenAIModels();
        }
    }

    /**
     * ดึง models จาก Google Gemini API
     */
    async getGeminiModels(): Promise<ModelInfo[]> {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) return this.getDefaultGeminiModels();

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );

            if (!response.ok) {
                console.warn('Failed to fetch Gemini models, using defaults');
                return this.getDefaultGeminiModels();
            }

            const data = await response.json();

            // Filter generative models only
            const genModels = data.models
                .filter((m: any) =>
                    m.supportedGenerationMethods?.includes('generateContent') &&
                    m.name.includes('gemini')
                )
                .map((m: any) => ({
                    id: m.name.replace('models/', ''),
                    name: m.displayName || this.formatModelName(m.name.replace('models/', '')),
                    description: m.description?.substring(0, 50) || '',
                }));

            return genModels.length > 0 ? genModels : this.getDefaultGeminiModels();
        } catch (error) {
            console.error('Error fetching Gemini models:', error);
            return this.getDefaultGeminiModels();
        }
    }

    /**
     * ดึง models จาก Groq API
     */
    async getGroqModels(): Promise<ModelInfo[]> {
        const apiKey = this.configService.get<string>('GROQ_API_KEY');
        if (!apiKey) return this.getDefaultGroqModels();

        try {
            const response = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });

            if (!response.ok) {
                console.warn('Failed to fetch Groq models, using defaults');
                return this.getDefaultGroqModels();
            }

            const data = await response.json();

            const models = data.data
                .filter((m: any) => m.active !== false)
                .map((m: any) => ({
                    id: m.id,
                    name: this.formatModelName(m.id),
                    description: `${m.context_window ? `${(m.context_window / 1000).toFixed(0)}K context` : ''}`,
                }))
                .sort((a: any, b: any) => a.name.localeCompare(b.name));

            return models.length > 0 ? models : this.getDefaultGroqModels();
        } catch (error) {
            console.error('Error fetching Groq models:', error);
            return this.getDefaultGroqModels();
        }
    }

    /**
     * ดึง models จาก Claude (static list - ไม่มี API)
     */
    async getClaudeModels(): Promise<ModelInfo[]> {
        return this.getDefaultClaudeModels();
    }

    /**
     * ดึง models ของทุก provider
     */
    async getAllModels(): Promise<Record<string, ModelInfo[]>> {
        const [openai, gemini, claude, groq] = await Promise.all([
            this.getOpenAIModels(),
            this.getGeminiModels(),
            this.getClaudeModels(),
            this.getGroqModels(),
        ]);

        return {
            openai,
            gemini,
            claude,
            groq,
            mock: [{ id: 'mock-v1', name: 'Mock v1', description: 'ข้อมูลจำลอง' }],
        };
    }

    // ===== Default Models (Fallback) =====

    private getDefaultOpenAIModels(): ModelInfo[] {
        return [
            { id: 'gpt-4o', name: 'GPT-4o', description: 'รุ่นใหม่ล่าสุด' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'ราคาถูก คุณภาพดี' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'เร็วกว่า GPT-4' },
            { id: 'gpt-4', name: 'GPT-4', description: 'ฉลาดมาก' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'เร็ว ราคาถูก' },
        ];
    }

    private getDefaultGeminiModels(): ModelInfo[] {
        return [
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'รุ่นใหม่ล่าสุด' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'เร็วมาก ฟรี!' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'ฉลาดกว่า' },
        ];
    }

    private getDefaultClaudeModels(): ModelInfo[] {
        return [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'รุ่นใหม่' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'ฉลาดที่สุด' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'สมดุล' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'เร็ว ราคาถูก' },
        ];
    }

    private getDefaultGroqModels(): ModelInfo[] {
        return [
            { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'รุ่นใหม่' },
            { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: 'ฉลาด ฟรี!' },
            { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'เร็วมาก ฟรี!' },
            { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Mistral AI' },
            { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google Gemma' },
        ];
    }

    // ===== Helpers =====

    private formatModelName(id: string): string {
        return id
            .replace(/-/g, ' ')
            .replace(/(\d+)b/gi, '$1B')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private getModelDescription(provider: string, modelId: string): string {
        const descriptions: Record<string, Record<string, string>> = {
            openai: {
                'gpt-4o': 'รุ่นใหม่ล่าสุด',
                'gpt-4o-mini': 'ราคาถูก คุณภาพดี',
                'gpt-4-turbo': 'เร็วกว่า GPT-4',
                'gpt-4': 'ฉลาดมาก',
                'gpt-3.5-turbo': 'เร็ว ราคาถูก',
            },
        };

        return descriptions[provider]?.[modelId] || '';
    }
}
