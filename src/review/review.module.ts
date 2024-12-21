import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, reviewSchema } from './schema/review';
import { Product, productSchema } from 'src/product/schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Review.name, schema:reviewSchema},
      {name: Product.name, schema:productSchema},
    ])
  ],
  controllers: [ReviewController],
  providers: [ReviewService]
})
export class ReviewModule {}
