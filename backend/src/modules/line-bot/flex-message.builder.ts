import { Injectable } from '@nestjs/common';

interface ActivityData {
    type: string;
    description: string;
    plotName?: string;
    quantity?: number;
    unit?: string;
    date?: string;
    confidence?: number;
}

/**
 * Flex Message Builder - สร้าง LINE Flex Messages
 */
@Injectable()
export class FlexMessageBuilder {
    /**
     * สร้าง Activity Confirmation Card
     */
    buildActivityConfirmCard(activity: ActivityData): any {
        const activityEmoji = this.getActivityEmoji(activity.type);
        const dateStr = activity.date
            ? new Date(activity.date).toLocaleDateString('th-TH')
            : new Date().toLocaleDateString('th-TH');

        return {
            type: 'bubble',
            size: 'kilo',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            {
                                type: 'text',
                                text: activityEmoji,
                                size: 'xl',
                                flex: 0,
                            },
                            {
                                type: 'text',
                                text: 'ยืนยันกิจกรรม',
                                weight: 'bold',
                                size: 'lg',
                                margin: 'sm',
                                color: '#2E7D32',
                            },
                        ],
                        alignItems: 'center',
                    },
                ],
                backgroundColor: '#E8F5E9',
                paddingAll: 'lg',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: activity.description,
                        weight: 'bold',
                        size: 'md',
                        wrap: true,
                    },
                    {
                        type: 'separator',
                        margin: 'lg',
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: [
                            this.buildDetailRow('ประเภท', this.getActivityTypeName(activity.type)),
                            ...(activity.plotName ? [this.buildDetailRow('แปลง', activity.plotName)] : []),
                            ...(activity.quantity ? [this.buildDetailRow('ปริมาณ', `${activity.quantity} ${activity.unit || ''}`)] : []),
                            this.buildDetailRow('วันที่', dateStr),
                        ],
                    },
                    ...(activity.confidence && activity.confidence < 0.8 ? [{
                        type: 'box' as const,
                        layout: 'horizontal' as const,
                        margin: 'lg',
                        contents: [{
                            type: 'text' as const,
                            text: `⚠️ ความมั่นใจ ${Math.round(activity.confidence * 100)}%`,
                            size: 'xs' as const,
                            color: '#FFA000',
                        }],
                    }] : []),
                ],
                paddingAll: 'lg',
            },
            footer: {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        style: 'secondary',
                        height: 'sm',
                        action: {
                            type: 'postback',
                            label: '✏️ แก้ไข',
                            data: `action=edit_activity&data=${encodeURIComponent(JSON.stringify(activity))}`,
                        },
                        flex: 1,
                    },
                    {
                        type: 'button',
                        style: 'primary',
                        height: 'sm',
                        color: '#4CAF50',
                        action: {
                            type: 'postback',
                            label: '✅ บันทึก',
                            data: `action=confirm_activity&data=${encodeURIComponent(JSON.stringify(activity))}`,
                        },
                        flex: 1,
                    },
                ],
                paddingAll: 'lg',
            },
        };
    }

    /**
     * สร้าง Quick Reply Menu
     */
    buildQuickReplyMenu(): any {
        return {
            type: 'bubble',
            size: 'micro',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '🌾 ช่วยอะไรได้บ้าง?',
                        weight: 'bold',
                        size: 'sm',
                    },
                ],
                paddingAll: 'md',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        height: 'sm',
                        color: '#4CAF50',
                        action: {
                            type: 'message',
                            label: '📝 บันทึกกิจกรรม',
                            text: 'บันทึกกิจกรรม',
                        },
                    },
                    {
                        type: 'button',
                        style: 'secondary',
                        height: 'sm',
                        action: {
                            type: 'message',
                            label: '❓ ถามคำถาม',
                            text: 'ถามคำถาม',
                        },
                    },
                ],
                paddingAll: 'md',
            },
        };
    }

    /**
     * สร้าง Error Message
     */
    buildErrorCard(message: string): any {
        return {
            type: 'bubble',
            size: 'kilo',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '❌ เกิดข้อผิดพลาด',
                        weight: 'bold',
                        color: '#D32F2F',
                    },
                    {
                        type: 'text',
                        text: message,
                        wrap: true,
                        margin: 'md',
                        size: 'sm',
                    },
                ],
                paddingAll: 'lg',
            },
        };
    }

    // ===== Private Helpers =====

    private buildDetailRow(label: string, value: string): any {
        return {
            type: 'box',
            layout: 'horizontal',
            contents: [
                {
                    type: 'text',
                    text: label,
                    color: '#888888',
                    size: 'sm',
                    flex: 2,
                },
                {
                    type: 'text',
                    text: value,
                    size: 'sm',
                    flex: 3,
                    wrap: true,
                },
            ],
        };
    }

    private getActivityEmoji(type: string): string {
        const emojis: Record<string, string> = {
            WATERING: '💧',
            FERTILIZING: '🧪',
            PESTICIDE: '🛡️',
            PLANTING: '🌱',
            HARVESTING: '🌾',
            PRUNING: '✂️',
            WEEDING: '🌿',
            OTHER: '📝',
        };
        return emojis[type] || '📝';
    }

    private getActivityTypeName(type: string): string {
        const names: Record<string, string> = {
            WATERING: 'รดน้ำ',
            FERTILIZING: 'ใส่ปุ๋ย',
            PESTICIDE: 'ฉีดยา',
            PLANTING: 'ปลูก',
            HARVESTING: 'เก็บเกี่ยว',
            PRUNING: 'ตัดแต่ง',
            WEEDING: 'กำจัดวัชพืช',
            OTHER: 'อื่นๆ',
        };
        return names[type] || type;
    }
}
