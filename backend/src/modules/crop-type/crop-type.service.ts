import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CropTypeService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.cropType.findMany({
            include: {
                varieties: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                    },
                },
            },
        });
    }

    async findVarieties(cropTypeId: string) {
        return this.prisma.cropVariety.findMany({
            where: { cropTypeId },
            select: {
                id: true,
                name: true,
                duration: true,
            },
        });
    }
}
