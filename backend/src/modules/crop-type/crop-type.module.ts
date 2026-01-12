import { Module } from '@nestjs/common';
import { CropTypeController } from './crop-type.controller';
import { CropTypeService } from './crop-type.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CropTypeController],
    providers: [CropTypeService],
    exports: [CropTypeService],
})
export class CropTypeModule { }
