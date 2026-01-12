import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FlexMessageBuilder } from './flex-message.builder';
import { VoiceService } from './voice.service';
import { AiService } from '../ai/ai.service';

interface LineEvent {
    type: string;
    replyToken: string;
    source: {
        userId: string;
        type: string;
    };
    message?: {
        type: string;
        text?: string;
        id?: string;
    };
    postback?: {
        data: string;
    };
}

interface ParsedActivity {
    type: string;
    description: string;
    plotName?: string;
    quantity?: number;
    unit?: string;
    date?: string;
    confidence: number;
}

/**
 * LINE Bot Service - จัดการ events จาก LINE
 */
@Injectable()
export class LineBotService {
    private readonly channelAccessToken: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private flexBuilder: FlexMessageBuilder,
        private voiceService: VoiceService,
        private aiService: AiService,
    ) {
        this.channelAccessToken = this.configService.get<string>('LINE_BOT_CHANNEL_ACCESS_TOKEN') || '';
    }

    /**
     * จัดการ event จาก LINE webhook
     */
    async handleEvent(event: LineEvent): Promise<any> {
        switch (event.type) {
            case 'message':
                return this.handleMessage(event);
            case 'postback':
                return this.handlePostback(event);
            case 'follow':
                return this.handleFollow(event);
            default:
                console.log('Unhandled event type:', event.type);
                return null;
        }
    }

    /**
     * จัดการข้อความ (text, voice, image)
     */
    private async handleMessage(event: LineEvent): Promise<any> {
        const messageType = event.message?.type;

        switch (messageType) {
            case 'text':
                return this.handleTextMessage(event);
            case 'audio':
                return this.handleVoiceMessage(event);
            default:
                return this.replyText(event.replyToken, 'ขออภัย ฉันรับได้เฉพาะข้อความหรือเสียงเท่านั้น');
        }
    }

    /**
     * จัดการข้อความ text
     */
    private async handleTextMessage(event: LineEvent): Promise<any> {
        const text = event.message?.text || '';
        const userId = event.source.userId;

        // หา user จาก LINE userId
        const user = await this.findOrCreateUser(userId);

        // วิเคราะห์ข้อความด้วย AI
        const result = await this.parseMessageWithAI(text, user?.id);

        if (result.type === 'activity') {
            // ส่ง Flex Message card ให้ยืนยัน
            const flexMessage = this.flexBuilder.buildActivityConfirmCard(result.data);
            return this.replyFlex(event.replyToken, 'ยืนยันกิจกรรม', flexMessage);
        } else if (result.type === 'question') {
            // ตอบคำถาม
            return this.replyText(event.replyToken, result.answer);
        } else {
            // ไม่เข้าใจ
            return this.replyText(event.replyToken,
                '🤖 ฉันสามารถช่วยได้ดังนี้:\n\n' +
                '📝 บันทึกกิจกรรม:\n"ใส่ปุ๋ย 2 กก แปลง A"\n"รดน้ำเมื่อวาน"\n\n' +
                '❓ ถามคำถาม:\n"ข้าวควรรดน้ำกี่ครั้งต่อวัน"\n"โรคใบไหม้รักษายังไง"'
            );
        }
    }

    /**
     * จัดการข้อความเสียง
     */
    private async handleVoiceMessage(event: LineEvent): Promise<any> {
        const audioId = event.message?.id;
        if (!audioId) {
            return this.replyText(event.replyToken, 'ไม่สามารถรับเสียงได้');
        }

        try {
            // ดาวน์โหลดและแปลงเสียงเป็นข้อความ
            const audioBuffer = await this.getAudioContent(audioId);
            const transcription = await this.voiceService.transcribe(audioBuffer);

            if (!transcription) {
                return this.replyText(event.replyToken, 'ไม่สามารถแปลงเสียงเป็นข้อความได้ กรุณาลองใหม่');
            }

            // แสดงข้อความที่แปลงได้
            await this.replyText(event.replyToken, `🎤 ได้ยินว่า: "${transcription}"\n\nกำลังวิเคราะห์...`);

            // สร้าง event ใหม่สำหรับ text
            const textEvent: LineEvent = {
                ...event,
                message: {
                    type: 'text',
                    text: transcription,
                },
            };

            return this.handleTextMessage(textEvent);
        } catch (error) {
            console.error('Voice processing error:', error);
            return this.replyText(event.replyToken, 'เกิดข้อผิดพลาดในการแปลงเสียง');
        }
    }

    /**
     * จัดการ postback (กดปุ่มจาก Flex Message)
     */
    private async handlePostback(event: LineEvent): Promise<any> {
        const data = event.postback?.data || '';
        const params = new URLSearchParams(data);
        const action = params.get('action');

        switch (action) {
            case 'confirm_activity':
                return this.confirmActivity(event, params);
            case 'edit_activity':
                return this.editActivity(event, params);
            case 'cancel':
                return this.replyText(event.replyToken, '❌ ยกเลิกแล้ว');
            default:
                return null;
        }
    }

    /**
     * จัดการผู้ติดตามใหม่
     */
    private async handleFollow(event: LineEvent): Promise<any> {
        return this.replyText(event.replyToken,
            '🌾 ยินดีต้อนรับสู่ Smart Farm!\n\n' +
            '🤖 ฉันคือผู้ช่วยอัจฉริยะ สามารถช่วยคุณได้:\n\n' +
            '📝 บันทึกกิจกรรม:\n"ใส่ปุ๋ย 2 กก แปลง A"\n"รดน้ำเมื่อวาน"\n\n' +
            '❓ ถามคำถามเกษตร:\n"ข้าวควรใส่ปุ๋ยตอนไหน"\n"โรคใบไหม้คืออะไร"\n\n' +
            '🎤 พูดเป็นเสียงก็ได้!'
        );
    }

    /**
     * ยืนยันบันทึกกิจกรรม
     */
    private async confirmActivity(event: LineEvent, params: URLSearchParams): Promise<any> {
        const activityData = JSON.parse(decodeURIComponent(params.get('data') || '{}'));
        const userId = event.source.userId;

        const user = await this.findOrCreateUser(userId);
        if (!user) {
            return this.replyText(event.replyToken, 'ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน');
        }

        // หา plot ถ้าระบุ
        let plotId: string | null = null;
        if (activityData.plotName) {
            const plot = await this.prisma.plot.findFirst({
                where: {
                    userId: user.id,
                    name: { contains: activityData.plotName, mode: 'insensitive' },
                },
            });
            plotId = plot?.id || null;
        }

        // บันทึกกิจกรรม
        const activity = await this.prisma.activity.create({
            data: {
                userId: user.id,
                plotId,
                type: activityData.type || 'GENERAL',
                description: activityData.description,
                quantity: activityData.quantity,
                unit: activityData.unit,
                date: activityData.date ? new Date(activityData.date) : new Date(),
            },
        });

        return this.replyText(event.replyToken,
            `✅ บันทึกสำเร็จ!\n\n` +
            `📝 ${activityData.description}\n` +
            `📅 ${new Date(activity.date).toLocaleDateString('th-TH')}\n` +
            `${plotId ? `🌾 แปลง: ${activityData.plotName}` : ''}`
        );
    }

    /**
     * แก้ไขกิจกรรม (เปิด LIFF)
     */
    private async editActivity(event: LineEvent, params: URLSearchParams): Promise<any> {
        const liffUrl = `${this.configService.get('FRONTEND_URL')}/liff/activity/edit`;
        return this.replyText(event.replyToken, `แก้ไขได้ที่: ${liffUrl}`);
    }

    // ===== Helper Methods =====

    /**
     * วิเคราะห์ข้อความด้วย AI
     */
    private async parseMessageWithAI(text: string, userId?: string): Promise<any> {
        try {
            // ลองแยกเป็นกิจกรรมก่อน
            const activityResult = await this.aiService.parseActivityFromText(userId || 'unknown', text);

            if (activityResult && activityResult.confidence > 0.5) {
                return {
                    type: 'activity',
                    data: {
                        type: activityResult.type,
                        description: activityResult.description || text,
                        plotName: activityResult.plotName,
                        quantity: activityResult.quantity || activityResult.amount,
                        unit: activityResult.unit,
                        date: activityResult.date,
                        confidence: activityResult.confidence,
                    },
                };
            }

            // ถ้าไม่ใช่กิจกรรม ลองเป็นคำถาม
            const answerResult = await this.aiService.answerQuestion(text);
            if (answerResult) {
                return {
                    type: 'question',
                    answer: answerResult,
                };
            }

            return { type: 'unknown' };
        } catch (error) {
            console.error('AI parsing error:', error);
            return { type: 'unknown' };
        }
    }

    /**
     * หาหรือสร้าง user จาก LINE userId
     */
    private async findOrCreateUser(lineUserId: string) {
        // ใช้ AuthProvider แทน lineUserId field โดยตรง
        const provider = await this.prisma.authProvider.findFirst({
            where: {
                provider: 'LINE',
                providerUid: lineUserId,
            },
            include: { user: true },
        });

        if (provider?.user) return provider.user;

        // ดึงข้อมูล profile จาก LINE
        const profile = await this.getLineProfile(lineUserId);

        if (profile) {
            // สร้าง user ใหม่พร้อม AuthProvider
            const newUser = await this.prisma.user.create({
                data: {
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl,
                    providers: {
                        create: {
                            provider: 'LINE',
                            providerUid: lineUserId,
                        },
                    },
                },
            });
            return newUser;
        }

        return null;
    }

    /**
     * ดึง profile จาก LINE
     */
    private async getLineProfile(userId: string): Promise<any> {
        if (!this.channelAccessToken) return null;

        try {
            const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
                headers: { 'Authorization': `Bearer ${this.channelAccessToken}` },
            });
            return response.ok ? response.json() : null;
        } catch {
            return null;
        }
    }

    /**
     * ดึงเนื้อหาเสียงจาก LINE
     */
    private async getAudioContent(messageId: string): Promise<Buffer> {
        const response = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
            headers: { 'Authorization': `Bearer ${this.channelAccessToken}` },
        });

        if (!response.ok) throw new Error('Failed to get audio content');

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /**
     * ตอบกลับด้วยข้อความ
     */
    private async replyText(replyToken: string, text: string): Promise<any> {
        return this.reply(replyToken, [{ type: 'text', text }]);
    }

    /**
     * ตอบกลับด้วย Flex Message
     */
    private async replyFlex(replyToken: string, altText: string, contents: any): Promise<any> {
        return this.reply(replyToken, [{
            type: 'flex',
            altText,
            contents,
        }]);
    }

    /**
     * ส่ง reply ไป LINE
     */
    private async reply(replyToken: string, messages: any[]): Promise<any> {
        if (!this.channelAccessToken || this.channelAccessToken.startsWith('mock')) {
            console.log('LINE Reply (mock):', JSON.stringify(messages, null, 2));
            return { mock: true, messages };
        }

        const response = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.channelAccessToken}`,
            },
            body: JSON.stringify({ replyToken, messages }),
        });

        return response.json();
    }
    /**
     * ส่งข้อความหาผู้ใช้ (Push Message)
     */
    async pushMessage(userId: string, messages: any[]): Promise<any> {
        if (!this.channelAccessToken || this.channelAccessToken.startsWith('mock')) {
            console.log(`LINE Push to ${userId} (mock):`, JSON.stringify(messages, null, 2));
            return { mock: true, messages };
        }

        try {
            const response = await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.channelAccessToken}`,
                },
                body: JSON.stringify({ to: userId, messages }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('LINE Push Error:', error);
                throw new Error(`Failed to push message: ${error}`);
            }

            return response.json();
        } catch (error) {
            console.error('Push message failed:', error);
            throw error;
        }
    }
}
