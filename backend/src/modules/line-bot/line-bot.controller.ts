import { Controller, Post, Body, Headers, HttpCode, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { LineBotService } from './line-bot.service';
import { Request } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * LINE Bot Controller - รับ Webhook events จาก LINE
 */
@ApiTags('LINE Bot')
@Controller('line')
export class LineBotController {
    constructor(
        private readonly lineBotService: LineBotService,
        private readonly configService: ConfigService,
    ) { }

    @Post('webhook')
    @HttpCode(200)
    @ApiOperation({ summary: 'LINE Webhook endpoint' })
    async handleWebhook(
        @Body() body: any,
        @Headers('x-line-signature') signature: string,
        @Req() req: RawBodyRequest<Request>,
    ) {
        // Verify signature
        const channelSecret = this.configService.get<string>('LINE_BOT_CHANNEL_SECRET');

        if (channelSecret && channelSecret !== 'mock-line-bot-secret') {
            const rawBody = req.rawBody || JSON.stringify(body);
            const hash = crypto
                .createHmac('SHA256', channelSecret)
                .update(rawBody)
                .digest('base64');

            if (signature !== hash) {
                console.warn('Invalid LINE signature');
                return { status: 'error', message: 'Invalid signature' };
            }
        }

        // Process events
        const events = body.events || [];

        for (const event of events) {
            try {
                await this.lineBotService.handleEvent(event);
            } catch (error) {
                console.error('Error handling LINE event:', error);
            }
        }

        return { status: 'ok' };
    }

    @Post('test')
    @ApiOperation({ summary: 'ทดสอบ LINE Bot (Development only)' })
    async testBot(@Body() body: { message: string; userId?: string }) {
        const mockEvent = {
            type: 'message',
            replyToken: 'test-token',
            source: {
                userId: body.userId || 'test-user',
                type: 'user',
            },
            message: {
                type: 'text',
                text: body.message,
            },
        };

        const result = await this.lineBotService.handleEvent(mockEvent);
        return result;
    }
}
