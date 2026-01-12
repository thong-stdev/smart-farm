import { Module } from '@nestjs/common';
import { LineBotController } from './line-bot.controller';
import { LineBotService } from './line-bot.service';
import { FlexMessageBuilder } from './flex-message.builder';
import { VoiceService } from './voice.service';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [LineBotController],
    providers: [LineBotService, FlexMessageBuilder, VoiceService],
    exports: [LineBotService, FlexMessageBuilder],
})
export class LineBotModule { }
