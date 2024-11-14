import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, categorySchema } from './schema/category.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[MongooseModule.forFeature([{name: Category.name, schema:categorySchema}]),
  JwtModule.register({
    secret: process.env.JWT_SECRET, // Ensure this environment variable is set
    signOptions: { expiresIn: '5d' },
  }),
],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class CategoryModule {}
