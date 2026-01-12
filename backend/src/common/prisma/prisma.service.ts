import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
        console.log('📦 เชื่อมต่อฐานข้อมูลสำเร็จ');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('📦 ปิดการเชื่อมต่อฐานข้อมูล');
    }
}
