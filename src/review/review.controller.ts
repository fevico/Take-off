import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { AddRatingDto } from './dto/review.dto';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller('review')
@ApiTags("Reviews")
export class ReviewController {
    constructor(private reviewService: ReviewService) {}

    // Decorate the controller method
    @Post('add-rating')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({
        summary: 'Add a rating for a product',
        description: 'Authenticated users can add a rating and review for a product.',
    })
    @ApiBearerAuth()
    @ApiBody({
        description: 'Payload to add a rating',
        type: AddRatingDto,
        examples: {
            example1: {
                summary: 'Sample Rating',
                description: 'A sample payload for adding a rating',
                value: {
                    product: '64a92e3b8c1a8a9d76543210',
                    rating: 4,
                    content: 'Great product!',
                },
            },
        },
    })
    addRating(@Body() addRating: AddRatingDto, @Req() req: Request) {
        const user = req.user.id;
        return this.reviewService.addRating(addRating, user);
    }
    
    // Decorate the controller method
    @Get('get-review/:id')
    @UseGuards(AuthenticationGuard)
    @ApiOperation({
        summary: 'Get a review for a product',
        description: 'Authenticated users can retrieve their review for a specific product by ID.',
    })
    @ApiBearerAuth() // Indicates that this endpoint requires authentication
    @ApiParam({
        name: 'id',
        description: 'The ID of the product to retrieve the review for',
        example: '64a92e3b8c1a8a9d76543210',
    })
    getReview(@Param('id') id: string, @Req() req: Request) {
        const user = req.user.id;
        return this.reviewService.getReview(user, id);
    }
    

    @Get('list/:productId')
    @ApiOperation({ summary: 'Get public reviews for a product with pagination' })
    @ApiParam({ name: 'productId', description: 'The ID of the product', required: true })
    @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, example: 1 })
    @ApiQuery({ name: 'limit', description: 'Number of items per page', required: false, example: 10 })
    getPublicReview(
        @Param('productId') productId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.reviewService.getPublicReview(productId, page, limit);
    }

}
