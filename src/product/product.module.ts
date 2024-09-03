import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, productSchema } from './schema/product.schema';

@Module({
  imports:[MongooseModule.forFeature([{name: Product.name, schema:productSchema}])],
  providers: [ProductService],
  controllers: [ProductController]
})
export class ProductModule {}
