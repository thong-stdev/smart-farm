import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductService, CreateProductDto, UpdateProductDto } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('สินค้าและวัสดุ')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    // ==================== สินค้า ====================

    @Get('search')
    @ApiOperation({ summary: 'ค้นหาสินค้าจากชื่อ' })
    @ApiQuery({ name: 'q', required: true, description: 'คำค้นหา' })
    async search(@Query('q') q: string) {
        return this.productService.searchProducts(q);
    }

    @Get()
    @ApiOperation({ summary: 'ดึงรายการสินค้าทั้งหมด' })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'typeId', required: false })
    @ApiQuery({ name: 'brandId', required: false })
    async findAll(
        @Query('categoryId') categoryId?: string,
        @Query('typeId') typeId?: string,
        @Query('brandId') brandId?: string,
    ) {
        return this.productService.findAllProducts(categoryId, typeId, brandId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'ดึงข้อมูลสินค้าตาม ID' })
    @ApiParam({ name: 'id', description: 'รหัสสินค้า' })
    async findById(@Param('id') id: string) {
        return this.productService.findProductById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'เพิ่มสินค้าใหม่' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['name'],
            properties: {
                name: { type: 'string', example: 'ปุ๋ยยูเรีย 46-0-0' },
                categoryId: { type: 'string' },
                typeId: { type: 'string' },
                brandId: { type: 'string' },
                price: { type: 'number', example: 750 },
                description: { type: 'string' },
                imageUrl: { type: 'string' },
            },
        },
    })
    async create(@Body() dto: CreateProductDto) {
        return this.productService.createProduct(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'แก้ไขสินค้า' })
    @ApiParam({ name: 'id', description: 'รหัสสินค้า' })
    async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.productService.updateProduct(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ลบสินค้า' })
    @ApiParam({ name: 'id', description: 'รหัสสินค้า' })
    async delete(@Param('id') id: string) {
        return this.productService.deleteProduct(id);
    }

    // ==================== หมวดหมู่ ====================

    @Get('categories/list')
    @ApiOperation({ summary: 'ดึงรายการหมวดหมู่สินค้า' })
    async findAllCategories() {
        return this.productService.findAllCategories();
    }

    @Post('categories')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'เพิ่มหมวดหมู่ใหม่' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['name'],
            properties: {
                name: { type: 'string', example: 'ปุ๋ย' },
            },
        },
    })
    async createCategory(@Body() body: { name: string }) {
        return this.productService.createCategory(body.name);
    }

    // ==================== ประเภท ====================

    @Get('types/:categoryId')
    @ApiOperation({ summary: 'ดึงรายการประเภทตามหมวดหมู่' })
    @ApiParam({ name: 'categoryId', description: 'รหัสหมวดหมู่' })
    async findTypesByCategory(@Param('categoryId') categoryId: string) {
        return this.productService.findTypesByCategory(categoryId);
    }

    @Post('types')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'เพิ่มประเภทใหม่' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['name', 'categoryId'],
            properties: {
                name: { type: 'string', example: 'ปุ๋ยเคมี' },
                categoryId: { type: 'string' },
            },
        },
    })
    async createType(@Body() body: { name: string; categoryId: string }) {
        return this.productService.createType(body.name, body.categoryId);
    }

    // ==================== ยี่ห้อ ====================

    @Get('brands/list')
    @ApiOperation({ summary: 'ดึงรายการยี่ห้อ' })
    async findAllBrands() {
        return this.productService.findAllBrands();
    }

    @Post('brands')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'เพิ่มยี่ห้อใหม่' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['name'],
            properties: {
                name: { type: 'string', example: 'ตราหมี' },
            },
        },
    })
    async createBrand(@Body() body: { name: string }) {
        return this.productService.createBrand(body.name);
    }
}
