import { Controller, Post, Get, Body, Query, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiProviderFactory, AiProviderType } from './ai-provider.factory';
import { AiModelsService } from './ai-models.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI ผู้ช่วย')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly aiProviderFactory: AiProviderFactory,
        private readonly aiModelsService: AiModelsService,
    ) { }

    @Get('models')
    @ApiOperation({ summary: 'ดึงรายการ models ทั้งหมดจาก API' })
    async getAllModels() {
        return this.aiModelsService.getAllModels();
    }

    @Get('models/:provider')
    @ApiOperation({ summary: 'ดึงรายการ models ของ provider ที่ระบุ' })
    @ApiParam({ name: 'provider', enum: ['openai', 'gemini', 'claude', 'groq'] })
    async getModelsByProvider(@Param('provider') provider: string) {
        switch (provider) {
            case 'openai':
                return this.aiModelsService.getOpenAIModels();
            case 'gemini':
                return this.aiModelsService.getGeminiModels();
            case 'claude':
                return this.aiModelsService.getClaudeModels();
            case 'groq':
                return this.aiModelsService.getGroqModels();
            default:
                return [];
        }
    }

    @Get('providers')
    @ApiOperation({ summary: 'ดึงรายการ AI providers ที่ใช้งานได้' })
    async getProviders() {
        const providers = this.aiProviderFactory.getAvailableProviders();
        const current = this.aiProviderFactory.getCurrentProviderName();
        return {
            current,
            providers,
        };
    }

    @Patch('providers/current')
    @ApiOperation({ summary: 'เปลี่ยน AI provider และ/หรือ model ที่ใช้งาน' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['provider'],
            properties: {
                provider: {
                    type: 'string',
                    enum: ['openai', 'gemini', 'claude', 'groq', 'mock'],
                    example: 'gemini',
                },
                model: {
                    type: 'string',
                    example: 'gemini-1.5-flash',
                    description: 'Optional: ถ้าไม่ระบุจะใช้ model ปัจจุบัน',
                },
            },
        },
    })
    async setProvider(@Body() body: { provider: AiProviderType; model?: string }) {
        this.aiProviderFactory.setProvider(body.provider);

        // เปลี่ยน model ถ้าระบุมา
        if (body.model) {
            const success = this.aiProviderFactory.setModel(body.provider, body.model);
            if (!success) {
                return {
                    success: false,
                    current: this.aiProviderFactory.getCurrentProviderName(),
                    model: this.aiProviderFactory.getCurrentModel(),
                    message: `ไม่รองรับ model: ${body.model}`,
                };
            }
        }

        return {
            success: true,
            current: this.aiProviderFactory.getCurrentProviderName(),
            model: this.aiProviderFactory.getCurrentModel(),
            message: `เปลี่ยน AI provider เป็น ${body.provider} แล้ว`,
        };
    }

    @Post('parse')
    @ApiOperation({ summary: 'แยกข้อมูลกิจกรรมจากข้อความ' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['text'],
            properties: {
                text: {
                    type: 'string',
                    example: 'ใส่ปุ๋ยยูเรีย 2 กระสอบ 1500 บาท แปลง A วันนี้',
                    description: 'ข้อความที่ต้องการแยกข้อมูล'
                },
            },
        },
    })
    async parseText(@Request() req: any, @Body() body: { text: string }) {
        return this.aiService.parseActivityFromText(req.user.sub, body.text);
    }

    @Get('logs')
    @ApiOperation({ summary: 'ดึงประวัติการใช้งาน AI' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getLogs(@Request() req: any, @Query('limit') limit?: string) {
        return this.aiService.getAiLogs(req.user.sub, limit ? parseInt(limit) : 20);
    }

    @Post('suggest-plot')
    @ApiOperation({ summary: 'ค้นหาแปลงจากชื่อ' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['plotName'],
            properties: {
                plotName: { type: 'string', example: 'A' },
            },
        },
    })
    async suggestPlot(@Request() req: any, @Body() body: { plotName: string }) {
        return this.aiService.findPlotByName(req.user.sub, body.plotName);
    }

    @Post('suggest-product')
    @ApiOperation({ summary: 'ค้นหาสินค้าจากชื่อ' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['productName'],
            properties: {
                productName: { type: 'string', example: 'ยูเรีย' },
            },
        },
    })
    async suggestProduct(@Body() body: { productName: string }) {
        return this.aiService.findProductByName(body.productName);
    }
}

