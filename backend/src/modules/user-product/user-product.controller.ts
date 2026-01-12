import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProductService } from './user-product.service';

@ApiTags('สินค้า/วัสดุ ของฉัน')
@Controller('user-products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProductController {
    constructor(private userProductService: UserProductService) { }

    /**
     * ดึงรายการสินค้า/วัสดุ ของผู้ใช้
     */
    @Get()
    @ApiOperation({ summary: 'ดึงรายการสินค้า/วัสดุ ของฉัน' })
    @ApiResponse({ status: 200, description: 'รายการสินค้า/วัสดุ' })
    async findAll(
        @Request() req: any,
        @Query('category') category?: string,
    ) {
        return this.userProductService.findAll(req.user.sub, { category });
    }

    /**
     * ดึงสถิติ inventory
     */
    @Get('stats')
    @ApiOperation({ summary: 'ดึงสถิติสินค้า/วัสดุ ของฉัน' })
    async getStats(@Request() req: any) {
        return this.userProductService.getStats(req.user.sub);
    }

    /**
     * ค้นหาจาก catalog
     */
    @Get('catalog/search')
    @ApiOperation({ summary: 'ค้นหาสินค้าจาก catalog' })
    async searchCatalog(
        @Query('q') query: string,
        @Query('category') category?: string,
    ) {
        return this.userProductService.searchCatalog(query || '', category);
    }

    /**
     * ดึงสินค้า/วัสดุ ตาม ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'ดึงรายละเอียดสินค้า/วัสดุ' })
    async findById(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        const item = await this.userProductService.findById(req.user.sub, id);
        if (!item) {
            throw new HttpException('ไม่พบสินค้า/วัสดุ', HttpStatus.NOT_FOUND);
        }
        return item;
    }

    /**
     * เพิ่มสินค้า/วัสดุ ใหม่
     */
    @Post()
    @ApiOperation({ summary: 'เพิ่มสินค้า/วัสดุ ใหม่' })
    @ApiResponse({ status: 201, description: 'สร้างสำเร็จ' })
    async create(
        @Request() req: any,
        @Body() body: {
            name: string;
            category: string;
            type?: string;
            productId?: string;
            quantity?: number;
            unit?: string;
            brand?: string;
            price?: number;
            note?: string;
        },
    ) {
        return this.userProductService.create(req.user.sub, body);
    }

    /**
     * อัปเดตสินค้า/วัสดุ
     */
    @Patch(':id')
    @ApiOperation({ summary: 'อัปเดตสินค้า/วัสดุ' })
    async update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: {
            name?: string;
            category?: string;
            type?: string;
            productId?: string;
            quantity?: number;
            unit?: string;
            brand?: string;
            price?: number;
            note?: string;
        },
    ) {
        try {
            return await this.userProductService.update(req.user.sub, id, body);
        } catch (error) {
            throw new HttpException(
                error.message || 'ไม่สามารถอัปเดตได้',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * อัปเดตจำนวน (เพิ่ม/ลด stock)
     */
    @Patch(':id/quantity')
    @ApiOperation({ summary: 'อัปเดตจำนวนสินค้า' })
    async updateQuantity(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { amount: number },
    ) {
        try {
            return await this.userProductService.updateQuantity(
                req.user.sub,
                id,
                body.amount,
            );
        } catch (error) {
            throw new HttpException(
                error.message || 'ไม่สามารถอัปเดตจำนวนได้',
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * ลบสินค้า/วัสดุ
     */
    @Delete(':id')
    @ApiOperation({ summary: 'ลบสินค้า/วัสดุ' })
    async delete(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        try {
            await this.userProductService.delete(req.user.sub, id);
            return { message: 'ลบสำเร็จ' };
        } catch (error) {
            throw new HttpException(
                error.message || 'ไม่สามารถลบได้',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
