import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, categorySchema } from './schema/category.schema';

@Module({
  imports:[MongooseModule.forFeature([{name: Category.name, schema:categorySchema}])],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class CategoryModule {}
