// Speech Service - จัดการ Speech-to-Text

export interface SpeechResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

type SpeechCallback = (result: SpeechResult) => void;

class SpeechService {
    private recognition: any = null;
    private isListening: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = true;
                this.recognition.lang = 'th-TH'; // ภาษาไทย
            }
        }
    }

    // ตรวจสอบว่า browser รองรับ Speech Recognition หรือไม่
    isSupported(): boolean {
        return this.recognition !== null;
    }

    // เริ่มฟังเสียง
    startListening(onResult: SpeechCallback, onError?: (error: any) => void): void {
        if (!this.recognition) {
            onError?.({ message: 'Speech recognition ไม่รองรับใน browser นี้' });
            return;
        }

        if (this.isListening) return;

        this.recognition.onresult = (event: any) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence || 0;
            const isFinal = result.isFinal;

            onResult({ transcript, confidence, isFinal });
        };

        this.recognition.onerror = (event: any) => {
            console.error('Speech error:', event.error);
            this.isListening = false;
            onError?.(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };

        try {
            this.recognition.start();
            this.isListening = true;
        } catch (error) {
            onError?.(error);
        }
    }

    // หยุดฟังเสียง
    stopListening(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    // ตรวจสอบสถานะ
    getIsListening(): boolean {
        return this.isListening;
    }
}

export const speechService = new SpeechService();
export default speechService;
