import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { AddRatingDto } from './dto/review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Review } from './schema/review';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Product } from 'src/product/schema/product.schema';

interface PopulatedUser{
    name: string;
}
@Injectable()

export class ReviewService {

    constructor(
        @InjectModel(Review.name) private reviewModel: Model<Review>,
        @InjectModel(Product.name) private productModel: Model<Product>,
){}
    async addRating(review: AddRatingDto, user: string){
        const {content, product, rating} = review;
        await this.reviewModel.findOneAndUpdate({product, user}, {content, product, rating, user}, {upsert: true});
        
    const [result] = await this.reviewModel.aggregate<{averageRating: number}>([
        {$match: {
            product: new Types.ObjectId(product) 
        }},
        {
          $group:{
            _id: null,
            averageRating: {$avg: "$rating"},
          }
        }
      ]) 
      await this.productModel.findByIdAndUpdate(product, {averageRating: result.averageRating})  
    return {message: "Rating added successfully"};
    }

    async getReview(user: string, product: string){
        if(!isValidObjectId(product)) throw new UnprocessableEntityException("Invalid product id");
        const review = await this.reviewModel.findOne({product, user});
        if(!review) throw new UnprocessableEntityException("No review found for this user!");
        return {content: review.content, rating: review.rating};
    }

    async getPublicReview(productId: string, page: number, limit: number) {
        if (!isValidObjectId(productId)) throw new UnprocessableEntityException("Invalid product id");
    
        const skip = (page - 1) * limit;
    
        // Fetch paginated reviews
        const reviews = await this.reviewModel
            .find({ product: productId })
            .populate<{ user: PopulatedUser }>({ path: "user", select: "name" })
            .skip(skip)
            .limit(limit)
            .exec();
    
        // Map reviews for response
        const mappedReviews = reviews.map((review) => ({
            content: review.content,
            rating: review.rating,
            user: review.user ? review.user.name : "Anonymous",
        }));
    
        // Get total count for pagination metadata
        const totalReviews = await this.reviewModel.countDocuments({ product: productId });
    
        return {
            reviews: mappedReviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                totalItems: totalReviews,
            },
        };
    }
    
}
