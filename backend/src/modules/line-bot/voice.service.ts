import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Voice Service - แปลงเสียงเป็นข้อความด้วย Groq Whisper
 */
@Injectable()
export class VoiceService {
    private readonly groqApiKey: string;

    constructor(private configService: ConfigService) {
        this.groqApiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    }

    /**
     * แปลงเสียงเป็นข้อความ
     */
    async transcribe(audioBuffer: Buffer): Promise<string | null> {
        if (!this.groqApiKey) {
            console.warn('GROQ_API_KEY not configured, using mock transcription');
            return this.mockTranscribe();
        }

        try {
            // สร้าง FormData สำหรับ upload
            const formData = new FormData();
            // Convert Buffer to Uint8Array for Blob compatibility
            const uint8Array = new Uint8Array(audioBuffer);
            const blob = new Blob([uint8Array], { type: 'audio/m4a' });
            formData.append('file', blob, 'audio.m4a');
            formData.append('model', 'whisper-large-v3');
            formData.append('language', 'th'); // Thai language
            formData.append('response_format', 'json');

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('Groq Whisper error:', error);
                return null;
            }

            const result = await response.json();
            return result.text || null;
        } catch (error) {
            console.error('Voice transcription error:', error);
            return null;
        }
    }

    /**
     * Mock transcription for development
     */
    private mockTranscribe(): string {
        const mockResponses = [
            'ใส่ปุ๋ย 2 กิโลกรัม แปลงนาข้าว',
            'รดน้ำเมื่อวานนี้',
            'วันนี้พ่นยาฆ่าแมลงแปลง A',
            'ปลูกข้าวนาปีใหม่',
        ];
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
}
