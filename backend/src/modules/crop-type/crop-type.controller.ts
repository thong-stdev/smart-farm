import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CropTypeService } from './crop-type.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@Controller('crop-types')
@UseGuards(JwtAuthGuard)
export class CropTypeController {
    constructor(private readonly cropTypeService: CropTypeService) { }

    @Get()
    findAll() {
        return this.cropTypeService.findAll();
    }

    @Get(':id/varieties')
    findVarieties(@Param('id') id: string) {
        return this.cropTypeService.findVarieties(id);
    }
}
