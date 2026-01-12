import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ActivityType } from '@prisma/client';

// ข้อมูลที่แยกจากข้อความ
export interface ParsedActivityData {
    type: ActivityType;
    description?: string;
    amount?: number;
    quantity?: number;
    unit?: string;
    plotName?: string;
    productName?: string;
    date?: Date;
    confidence: number;
}

// คำสำคัญสำหรับการแยกประเภทกิจกรรม
const ACTIVITY_KEYWORDS = {
    EXPENSE: ['ซื้อ', 'จ่าย', 'ใส่ปุ๋ย', 'ใส่ยา', 'พ่นยา', 'ค่า', 'จ้าง', 'เช่า'],
    INCOME: ['ขาย', 'ได้เงิน', 'รับเงิน', 'เก็บเกี่ยว', 'รายได้'],
    PLANTING: ['ปลูก', 'หว่าน', 'เพาะ', 'ย้ายกล้า'],
    GENERAL: ['ดูแล', 'ตรวจ', 'บันทึก', 'สำรวจ'],
};

// หน่วยนับที่พบบ่อย
const COMMON_UNITS = ['กระสอบ', 'กก.', 'กิโล', 'กิโลกรัม', 'ลิตร', 'ขวด', 'ถุง', 'ไร่', 'ตัน', 'ถัง', 'ม้วน'];

@Injectable()
export class AiService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    /**
     * แยกข้อมูลกิจกรรมจากข้อความ (Rule-based)
     * ใน Production จะใช้ OpenAI API แทน
     */
    async parseActivityFromText(userId: string, text: string): Promise<ParsedActivityData> {
        const normalizedText = text.trim().toLowerCase();

        // 1. ระบุประเภทกิจกรรม
        let activityType: ActivityType = 'GENERAL';
        let maxScore = 0;

        for (const [type, keywords] of Object.entries(ACTIVITY_KEYWORDS)) {
            const score = keywords.filter(kw => normalizedText.includes(kw)).length;
            if (score > maxScore) {
                maxScore = score;
                activityType = type as ActivityType;
            }
        }

        // 2. ดึงตัวเลข (จำนวน / ราคา)
        const numberMatches = text.match(/[\d,]+(?:\.\d+)?/g);
        let amount: number | undefined;
        let quantity: number | undefined;

        if (numberMatches && numberMatches.length > 0) {
            const numbers = numberMatches.map(n => parseFloat(n.replace(/,/g, '')));

            // ถ้ามี 2 ตัวเลข: ตัวแรกคือจำนวน, ตัวที่สองคือราคา
            if (numbers.length >= 2) {
                quantity = numbers[0];
                amount = numbers[1];
            } else if (numbers.length === 1) {
                // ถ้ามี 1 ตัวเลข: ถ้าเป็นรายจ่าย/รายรับ = ราคา, อื่นๆ = จำนวน
                if (activityType === 'EXPENSE' || activityType === 'INCOME') {
                    amount = numbers[0];
                } else {
                    quantity = numbers[0];
                }
            }
        }

        // 3. ดึงหน่วย
        let unit: string | undefined;
        for (const u of COMMON_UNITS) {
            if (normalizedText.includes(u)) {
                unit = u;
                break;
            }
        }

        // 4. ตรวจสอบชื่อแปลง
        let plotName: string | undefined;
        const plotMatch = text.match(/แปลง\s*([ก-ฮA-Za-z0-9]+)/);
        if (plotMatch) {
            plotName = plotMatch[1];
        }

        // 5. ตรวจสอบวันที่
        let date: Date | undefined;
        if (normalizedText.includes('วันนี้')) {
            date = new Date();
        } else if (normalizedText.includes('เมื่อวาน')) {
            date = new Date();
            date.setDate(date.getDate() - 1);
        }

        // 6. คำนวณความมั่นใจ
        const confidence = this.calculateConfidence(activityType, amount, quantity, plotName);

        // 7. บันทึก log
        await this.logAiActivity(userId, text, {
            type: activityType,
            description: text,
            amount,
            quantity,
            unit,
            plotName,
            date,
            confidence,
        });

        return {
            type: activityType,
            description: text,
            amount,
            quantity,
            unit,
            plotName,
            date: date || new Date(),
            confidence,
        };
    }

    /**
     * คำนวณความมั่นใจในการแยกข้อมูล
     */
    private calculateConfidence(
        type: ActivityType,
        amount?: number,
        quantity?: number,
        plotName?: string,
    ): number {
        let confidence = 0.3; // base confidence

        if (type !== 'GENERAL') confidence += 0.2;
        if (amount) confidence += 0.2;
        if (quantity) confidence += 0.15;
        if (plotName) confidence += 0.15;

        return Math.min(confidence, 1);
    }

    /**
     * บันทึก log การใช้งาน AI
     */
    private async logAiActivity(userId: string, rawInput: string, parsedData: ParsedActivityData) {
        await this.prisma.aiActivityLog.create({
            data: {
                userId,
                rawInput,
                parsedData: parsedData as any,
                confidence: parsedData.confidence,
                success: parsedData.confidence >= 0.5,
            },
        });
    }

    /**
     * ดึงประวัติการใช้งาน AI ของผู้ใช้
     */
    async getAiLogs(userId: string, limit: number = 20) {
        return this.prisma.aiActivityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * ค้นหาแปลงจากชื่อ
     */
    async findPlotByName(userId: string, plotName: string) {
        return this.prisma.plot.findFirst({
            where: {
                userId,
                name: {
                    contains: plotName,
                    mode: 'insensitive',
                },
                deletedAt: null,
            },
        });
    }

    /**
     * ค้นหาสินค้าจากชื่อ
     */
    async findProductByName(name: string) {
        return this.prisma.product.findFirst({
            where: {
                name: {
                    contains: name,
                    mode: 'insensitive',
                },
            },
        });
    }

    /**
     * ตอบคำถามเกี่ยวกับเกษตร/ยา/โรคพืช
     * ใช้ AI provider ที่ตั้งค่าไว้
     */
    async answerQuestion(question: string): Promise<string> {
        try {
            // ตรวจสอบว่าเป็นคำถามเกษตรหรือไม่
            const agriKeywords = ['ปลูก', 'ปุ๋ย', 'ยา', 'โรค', 'แมลง', 'รดน้ำ', 'เก็บเกี่ยว', 'ข้าว', 'ผัก', 'ผลไม้',
                'พืช', 'ดิน', 'สารเคมี', 'อินทรีย์', 'ศัตรูพืช', 'วัชพืช', 'ใบ', 'ราก', 'ลำต้น'];

            const isAgriQuestion = agriKeywords.some(kw => question.toLowerCase().includes(kw));

            if (!isAgriQuestion) {
                return '🌾 ฉันเชี่ยวชาญเรื่องเกษตรเท่านั้นนะ\n\nลองถามเรื่อง:\n- การปลูกพืช\n- โรคพืช/แมลงศัตรูพืช\n- ปุ๋ย/สารเคมี\n- การดูแลแปลง';
            }

            // Mock response สำหรับ development
            // ใน Production จะใช้ AI Provider จริง
            const mockAnswers: Record<string, string> = {
                'ปุ๋ย': '🧪 **การใส่ปุ๋ย**\n\nแนะนำใส่ปุ๋ยตามช่วงอายุพืช:\n- ระยะต้นกล้า: ใส่ปุ๋ย 46-0-0 (ยูเรีย)\n- ระยะติดดอก: ใส่ปุ๋ย 15-15-15\n- ระยะติดผล: ใส่ปุ๋ย 8-24-24',
                'โรค': '🛡️ **การป้องกันโรคพืช**\n\n1. ตรวจแปลงสม่ำเสมอ\n2. ใช้เชื้อราไตรโคเดอร์มา\n3. หลีกเลี่ยงการรดน้ำมากเกินไป\n4. ตัดใบที่เป็นโรคออก',
                'รดน้ำ': '💧 **การให้น้ำ**\n\n- ข้าว: ระดับน้ำ 5-10 ซม.\n- ผัก: วันละ 1-2 ครั้ง\n- ไม้ผล: สัปดาห์ละ 2 ครั้ง\n\nควรรดน้ำช่วงเช้าหรือเย็น',
                'แมลง': '🐛 **การกำจัดแมลง**\n\n- ใช้กับดักกาวเหลือง\n- ฉีดสารสกัดสะเดา\n- ปลูกตะไคร้หอมไล่แมลง\n- ใช้แมลงห้ำ (ตัวห้ำ)',
            };

            // หาคำตอบจาก keywords
            for (const [keyword, answer] of Object.entries(mockAnswers)) {
                if (question.includes(keyword)) {
                    return answer;
                }
            }

            // คำตอบกลางๆ
            return `🤖 คำถามดีมาก!\n\n"${question}"\n\nขอศึกษาข้อมูลเพิ่มเติมก่อนนะ ลองถามใหม่หรือติดต่อเกษตรกรผู้มีประสบการณ์ในพื้นที่`;
        } catch (error) {
            console.error('Answer question error:', error);
            return 'ขออภัย ไม่สามารถตอบคำถามได้ในขณะนี้';
        }
    }
}

