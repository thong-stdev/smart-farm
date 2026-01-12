import { AiProvider, AiCompletionOptions, AiCompletionResponse } from './ai-provider.interface';

/**
 * Mock Provider - ใช้สำหรับ development โดยไม่ต้องมี API key
 */
export class MockProvider implements AiProvider {
    readonly name = 'mock';
    readonly model = 'mock-v1';

    isAvailable(): boolean {
        return true; // Always available
    }

    async complete(options: AiCompletionOptions): Promise<AiCompletionResponse> {
        // Extract user message
        const userMessage = options.messages.find(m => m.role === 'user')?.content || '';

        // Simple mock response based on keywords
        let content = this.generateMockResponse(userMessage);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            content,
            provider: this.name,
            model: this.model,
            tokensUsed: content.length,
        };
    }

    private generateMockResponse(userMessage: string): string {
        const lowerMessage = userMessage.toLowerCase();

        // Farm-related responses
        if (lowerMessage.includes('แนะนำ') || lowerMessage.includes('ปลูก')) {
            return JSON.stringify({
                recommendation: 'ผักบุ้ง',
                reason: 'เหมาะกับสภาพอากาศปัจจุบัน ปลูกง่าย โตเร็ว',
                confidence: 0.85,
            });
        }

        if (lowerMessage.includes('โรค') || lowerMessage.includes('แมลง')) {
            return JSON.stringify({
                disease: 'เพลี้ยไฟ',
                treatment: 'พ่นสารสกัดสะเดา หรือใช้น้ำสบู่เจือจาง',
                prevention: 'ดูแลระบายน้ำให้ดี ไม่ให้น้ำขัง',
                confidence: 0.75,
            });
        }

        if (lowerMessage.includes('ปุ๋ย') || lowerMessage.includes('ใส่')) {
            return JSON.stringify({
                fertilizer: 'ปุ๋ยสูตร 15-15-15',
                amount: '25 กก./ไร่',
                timing: 'ช่วงเช้าหรือเย็น หลังรดน้ำ',
                confidence: 0.80,
            });
        }

        if (lowerMessage.includes('น้ำ') || lowerMessage.includes('รดน้ำ')) {
            return JSON.stringify({
                recommendation: 'รดน้ำเช้าและเย็น',
                amount: 'ประมาณ 30 ลิตร/ไร่',
                note: 'หลีกเลี่ยงการรดน้ำตอนแดดจัด',
                confidence: 0.82,
            });
        }

        // Default response
        return JSON.stringify({
            message: 'ขอบคุณสำหรับคำถาม ระบบ AI จะประมวลผลและให้คำแนะนำที่เหมาะสม',
            note: 'นี่เป็น Mock Response สำหรับ Development',
            confidence: 0.5,
        });
    }
}
