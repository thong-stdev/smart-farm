import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ParsedActivity {
    type?: 'INCOME' | 'EXPENSE' | 'PLANTING' | 'GENERAL';
    amount?: number;
    description?: string;
    date?: Date;
    categoryId?: string;
    customCategoryName?: string;
    productId?: string;
    customProductName?: string;
    plotName?: string;
    quantity?: number;
    unit?: string;
    confidence: number;
}

@Injectable()
export class ActivityAIService {
    private readonly logger = new Logger(ActivityAIService.name);
    private readonly provider: string;
    private readonly apiKey: string;
    private readonly model: string;

    constructor(private configService: ConfigService) {
        this.provider = this.configService.get('AI_PROVIDER', 'mock');
        // Handle both Google and Groq
        if (this.provider === 'gemini') {
            this.apiKey = this.configService.get('GEMINI_API_KEY', '');
            this.model = this.configService.get('GEMINI_MODEL', 'gemini-1.5-flash');
        } else if (this.provider === 'groq') {
            this.apiKey = this.configService.get('GROQ_API_KEY', '');
            this.model = this.configService.get('GROQ_MODEL', 'llama3-70b-8192');
        } else {
            this.apiKey = '';
            this.model = 'mock';
        }
    }

    async parseActivity(text: string): Promise<ParsedActivity> {
        this.logger.log(`Parsing activity: "${text}" with provider: ${this.provider}`);

        if (this.provider === 'mock') {
            return this.mockParse(text);
        }

        try {
            if (this.provider === 'gemini') {
                return await this.callGemini(text);
            } else if (this.provider === 'groq') {
                return await this.callGroq(text);
            }
        } catch (error) {
            this.logger.error(`AI Parsing failed: ${error.message}`, error.stack);
            // Fallback to mock if API fails
            return this.mockParse(text);
        }

        return this.mockParse(text);
    }

    private mockParse(text: string): ParsedActivity {
        // Simple heuristic for demo
        const isExpense = text.includes('ซื้อ') || text.includes('จ่าย') || text.includes('ค่า');
        const isIncome = text.includes('ขาย') || text.includes('ได้เงิน') || text.includes('รายรับ');
        const isPlanting = text.includes('ปลูก') || text.includes('ลงกล้า') || text.includes('หว่าน');

        const numbers = text.match(/\d+/g)?.map(Number) || [];
        const amount = numbers.length > 0 ? Math.max(...numbers) : undefined; // Assume largest number is amount

        return {
            type: isPlanting ? 'PLANTING' : isIncome ? 'INCOME' : isExpense ? 'EXPENSE' : 'GENERAL',
            amount: amount,
            description: text,
            date: new Date(),
            confidence: 0.5
        };
    }

    private async callGemini(text: string): Promise<ParsedActivity> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const prompt = this.getSystemPrompt(text);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) throw new Error('No content from Gemini');

        return this.parseJsonFromMarkdown(content);
    }

    private async callGroq(text: string): Promise<ParsedActivity> {
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        const prompt = this.getSystemPrompt(text);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a smart farm assistant. Output only JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error('No content from Groq');

        return this.parseJsonFromMarkdown(content);
    }

    private getSystemPrompt(userInput: string): string {
        return `
        Analyze the following agricultural activity text and extract structured data in JSON format.
        
        Input: "${userInput}"

        Rules:
        1. type: One of 'EXPENSE' (cost, buy, pay), 'INCOME' (sell, revenue), 'PLANTING' (sow, plant), 'GENERAL' (check, water, fertilize without cost).
           - "Buy fertilizer" -> EXPENSE
           - "Sell rice" -> INCOME
           - "Plant corn" -> PLANTING
        2. amount: Total money value involved (number only). If mixed with quantity, identify usually the larger number or with currency words (Baht, THB).
        3. date: ISO string (YYYY-MM-DD), default to today if not specified. Handle "yesterday" etc relative to now.
        4. category: Extract category name in Thai. Prefer one of: ['ปุ๋ย', 'สารกำจัดศัตรูพืช', 'เมล็ดพันธุ์', 'อุปกรณ์การเกษตร', 'ระบบน้ำ', 'ค่าแรง', 'เชื้อเพลิง']. If not found, use a reasonable short Thai name.
        5. product: Product name if mentioned (e.g., Urea 46-0-0, Jasmine Rice).
        6. quantity: Quantity of product (e.g., 5).
        7. unit: Unit of measurement (e.g., kg, bag, ton).
        8. plotName: Plot name if clearly mentioned. Look for words like "แปลง", "ที่นา", "ไร่" followed by name (e.g., "แปลง A", "นาลุงมี").
        
        Output JSON Only:
        {
            "type": "EXPENSE",
            "amount": 500,
            "description": "...",
            "date": "...",
            "category": "...",
            "product": "...",
            "quantity": 5,
            "unit": "bag",
            "plotName": "...",
            "confidence": 0.9
        }
        `;
    }

    private parseJsonFromMarkdown(text: string): ParsedActivity {
        try {
            // Remove markdown code blocks if present
            let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const start = cleanText.indexOf('{');
            const end = cleanText.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                cleanText = cleanText.substring(start, end + 1);
            }
            return JSON.parse(cleanText);
        } catch (e) {
            this.logger.error(`Failed to parse JSON from AI: ${text}`);
            throw new Error('Invalid JSON format from AI');
        }
    }
}
