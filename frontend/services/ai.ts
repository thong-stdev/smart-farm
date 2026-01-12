// AI Service - จัดการ AI Parser

import api from './api';

export interface ParsedActivity {
    type: 'INCOME' | 'EXPENSE' | 'PLANTING' | 'GENERAL';
    description?: string;
    amount?: number;
    quantity?: number;
    unit?: string;
    plotName?: string;
    productName?: string;
    date?: string;
    confidence: number;
}

export interface AiLog {
    id: string;
    rawInput: string;
    parsedData: ParsedActivity;
    confidence: number;
    success: boolean;
    createdAt: string;
}

class AiService {
    // แยกข้อมูลกิจกรรมจากข้อความ
    async parseText(text: string): Promise<ParsedActivity> {
        return api.post<ParsedActivity>('/ai/parse', { text });
    }

    // ค้นหาแปลงจากชื่อ
    async suggestPlot(plotName: string) {
        return api.post('/ai/suggest-plot', { plotName });
    }

    // ค้นหาสินค้าจากชื่อ
    async suggestProduct(productName: string) {
        return api.post('/ai/suggest-product', { productName });
    }

    // ดึงประวัติการใช้งาน AI
    async getLogs(limit: number = 20): Promise<AiLog[]> {
        return api.get<AiLog[]>(`/ai/logs?limit=${limit}`);
    }
}

export const aiService = new AiService();
export default aiService;
