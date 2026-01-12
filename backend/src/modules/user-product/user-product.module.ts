import { Module } from '@nestjs/common';
import { UserProductController } from './user-product.controller';
import { UserProductService } from './user-product.service';

@Module({
    controllers: [UserProductController],
    providers: [UserProductService],
    exports: [UserProductService],
})
export class UserProductModule { }
