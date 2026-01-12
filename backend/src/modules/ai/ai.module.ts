import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProviderFactory } from './ai-provider.factory';
import { AiModelsService } from './ai-models.service';

@Module({
    controllers: [AiController],
    providers: [AiService, AiProviderFactory, AiModelsService],
    exports: [AiService, AiProviderFactory, AiModelsService],
})
export class AiModule { }


