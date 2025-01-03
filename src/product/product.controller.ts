import { Body, Controller, Delete, Get, HttpException, HttpStatus, NotFoundException, Param, Patch, Post, Query, Req, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/role.decorator';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { AuthorizationGuard } from 'src/guards/Authorization';
import { Request } from 'express';

@ApiTags('Product')
@Controller('product')
export class ProductController {

    constructor(private productService: ProductService) {}

    @Roles(['admin', "seller"])
    @Post('create')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({ summary: 'Create a new product with file uploads' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Product Name' },
          description: { type: 'string', example: 'This is a product description' },
          price: { type: 'number', example: 49.99 },
          categoryId: { type: 'string', example: 'categoryId123' },
          quantity: { type: 'number', example: 100 },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary', // Indicates file upload
            },
            description: 'Array of image files',
          },
        },
      },
    })
    @ApiResponse({
      status: 201,
      description: 'Product created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'product123' },
          name: { type: 'string', example: 'Product Name' },
          description: { type: 'string', example: 'This is a product description' },
          price: { type: 'number', example: 49.99 },
          quantity: { type: 'number', example: 100 },
          categoryName: { type: 'string', example: 'Electronics' },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'img123' },
                url: { type: 'string', example: 'http://res.cloudinary.com/image.jpg' },
              },
            },
          },
          thumbnail: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'thumb123' },
              url: { type: 'string', example: 'http://res.cloudinary.com/thumbnail.jpg' },
            },
          },
        },
      },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })

    async createProduct(@Req() req: Request) {
      const fields = req.body as Record<string, any>;
      const files = req['files'] as Record<string, any>;
      const owner = req.user.id;
  
      // Convert each field as needed
      if (Array.isArray(fields.name)) {
        fields.name = fields.name[0];
      }
      if (Array.isArray(fields.description)) {
        fields.description = fields.description[0];
      }
      if (Array.isArray(fields.price)) {
        fields.price = parseFloat(fields.price[0]);
      }
      if (Array.isArray(fields.categoryId)) {
        fields.categoryId = fields.categoryId[0];
      }
      if (Array.isArray(fields.quantity)) {
        fields.quantity = parseFloat(fields.quantity[0]);
      }
  
        // Validate that categoryId is present
        if (!fields.categoryId) {
            throw new UnprocessableEntityException('CategoryId is required');
        }
    
        return this.productService.createProduct(fields, files, owner);
    }

    @Roles(['admin', "seller"])
    @Patch('update/:id')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({ summary: 'Update product with file uploads' })
    @ApiParam({ name: 'id', description: 'ID of the category to update', example: 'category-id' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Product Name' },
          description: { type: 'string', example: 'This is a product description' },
          price: { type: 'number', example: 49.99 },
          categoryId: { type: 'string', example: 'categoryId123' },
          quantity: { type: 'number', example: 100 },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary', // Indicates file upload
            },
            description: 'Array of image files',
          },
        },
      },
    })
    @ApiResponse({
      status: 201,
      description: 'Product created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'product123' },
          name: { type: 'string', example: 'Product Name' },
          description: { type: 'string', example: 'This is a product description' },
          price: { type: 'number', example: 49.99 },
          quantity: { type: 'number', example: 100 },
          categoryName: { type: 'string', example: 'Electronics' },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'img123' },
                url: { type: 'string', example: 'http://res.cloudinary.com/image.jpg' },
              },
            },
          },
          thumbnail: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'thumb123' },
              url: { type: 'string', example: 'http://res.cloudinary.com/thumbnail.jpg' },
            },
          },
        },
      },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })

    updateProduct(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
      const owner = req.user.id
        const fields = req.body as Record<string, any>;
        const files = req['files'] as Record<string, any>;
    
        // Convert each field as needed
        if (Array.isArray(fields.name)) {
            fields.name = fields.name[0];
        }
        if (Array.isArray(fields.description)) {
            fields.description = fields.description[0];
        }
        if (Array.isArray(fields.price)) {
            fields.price = parseFloat(fields.price[0]);
        }
        if (Array.isArray(fields.categoryId)) {
            fields.categoryId = fields.categoryId[0];
        }
        if (Array.isArray(fields.quantity)) {
            fields.quantity = fields.quantity[0];
        }
    
        return this.productService.updateProduct(fields, files, id, owner);

    }

    // @Get('all')
    // @ApiOperation({
    //   summary: 'Get all product records with pagination',
    //   description: 'Retrieve paginated product records.',
    // })
    // @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', example: 1 })
    // @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', example: 10 })
    // @ApiResponse({
    //   status: 200,
    //   description: 'Get paginated products',
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       currentPage: { type: 'number', example: 1 },
    //       totalPages: { type: 'number', example: 5 },
    //       totalItems: { type: 'number', example: 50 },
    //       data: {
    //         type: 'array',
    //         items: {
    //           type: 'object',
    //           properties: {
    //             id: { type: 'string', example: 'product123' },
    //             name: { type: 'string', example: 'Product Name' },
    //             description: { type: 'string', example: 'This is a product description' },
    //             price: { type: 'number', example: 49.99 },
    //             quantity: { type: 'number', example: 100 },
    //             categoryName: { type: 'string', example: 'Electronics' },
    //             images: {
    //               type: 'array',
    //               items: {
    //                 type: 'object',
    //                 properties: {
    //                   id: { type: 'string', example: 'img123' },
    //                   url: { type: 'string', example: 'http://res.cloudinary.com/image.jpg' },
    //                 },
    //               },
    //             },
    //             thumbnail: {
    //               type: 'object',
    //               properties: {
    //                 id: { type: 'string', example: 'thumb123' },
    //                 url: { type: 'string', example: 'http://res.cloudinary.com/thumbnail.jpg' },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // })
    // @ApiResponse({
    //   status: 400,
    //   description: 'Bad Request. Validation error or missing fields.',
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       statusCode: { type: 'number', example: 400 },
    //       message: { type: 'string', example: 'Validation failed' },
    //       error: { type: 'string', example: 'Bad Request' },
    //     },
    //   },
    // })
    // @ApiResponse({
    //   status: 403,
    //   description: 'Forbidden. User does not have the necessary permissions.',
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       statusCode: { type: 'number', example: 403 },
    //       message: { type: 'string', example: 'Forbidden' },
    //       error: { type: 'string', example: 'Forbidden' },
    //     },
    //   },
    // })
    // getAllProducts(@Query('page') page = 1, @Query('limit') limit = 10) {
    //   return this.productService.getAllProducts(page, limit);
    // }
    

    @Roles(['admin', 'seller'])
    @Get('user-products')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({
      summary: 'Get all products created by the current user with pagination',
      description: 'This endpoint allows you to retrieve all products created by the current user with pagination support.',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'The page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'The number of items per page (default: 10)' })
    @ApiResponse({
      status: 200,
      description: 'Get all products created by the current user with pagination',
      schema: {
        type: 'object',
        properties: {
          pagination: {
            type: 'object',
            properties: {
              currentPage: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 5 },
              totalItems: { type: 'number', example: 50 },
            },
          },
          result: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'product123' },
                name: { type: 'string', example: 'Product Name' },
                description: { type: 'string', example: 'This is a product description' },
                price: { type: 'number', example: 49.99 },
              },
            },
          },
        },
      },
    })
    @ApiResponse({
      status: 403,
      description: 'Forbidden. User does not have the necessary permissions.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Forbidden' },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    })
    async getProductsByUser(@Req() req: Request, @Query('page') page = 1, @Query('limit') limit = 10) {
      const user = req.user.id;
      return this.productService.getProductsByUser(user, +page, +limit); // Ensure `page` and `limit` are numbers
    }
    

    @Get('products')
    @ApiOperation({
      summary: 'Search, filter, and sort products with pagination',
      description: 'Retrieve products based on search query, category, price range, inStock status, and sorting with pagination.',
    })
    @ApiQuery({ name: 'searchQuery', required: false, description: 'Search term for product names' })
    @ApiQuery({ name: 'categories', required: false, description: 'Filter by category IDs' })
    @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter', example: 0 })
    @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter', example: 1000 })
    @ApiQuery({ name: 'inStock', required: false, description: 'Filter by in-stock status', example: true })
    @ApiQuery({ name: 'outOfStock', required: false, description: 'Filter by in-stock status', example: false })
    @ApiQuery({ name: 'sort', required: false, description: 'Sorting options: newest, alphabetical, priceLowToHigh, priceHighToLow', example: 'newest' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', example: 10 })
    async getProducts(
      @Query('searchQuery') searchQuery?: string,
      @Query('categories') categories?: string[],
      @Query('minPrice') minPrice?: number,
      @Query('maxPrice') maxPrice?: number,
      @Query('inStock') inStock?: boolean,
      @Query('outOfStock') outOfStock?: boolean,
      @Query('sort') sort?: string,
      @Query('page') page = 1,
      @Query('limit') limit = 10,
    ) {
      return this.productService.getProducts({ searchQuery, categories, minPrice, maxPrice, inStock, outOfStock, sort, page, limit });
    }
    
    @Get('featured')
    @ApiOperation({
        summary: 'Get featured products',
        description: 'This endpoint allows you to get featured products.'
      })
      @ApiResponse({
        status: 200,
        description: 'Featured products retrieved successfully',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'product123' },
                name: { type: 'string', example: 'Product Name' },
                description: { type: 'string', example: 'This is a product description' },
                price: { type: 'number', example: 49.99 },
                categoryName: { type: 'string', example: 'Electronics' },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'img123' },
                      url: { type: 'string', example: 'http://res.cloudinary.com/image.jpg' },
                    },
                  },
                },
                thumbnail: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'thumb123' },
                    url: { type: 'string', example: 'http://res.cloudinary.com/thumbnail.jpg' },
                  },
                },
            },
          },
        },
      })
      @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      getFeaturedProducts() {
      return this.productService.getFeaturedProducts();
    }


    @Roles(['admin', "seller"])
    @Post(':productId/toggle-stock')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({
      summary: 'Toggle the stock status of a product',
      description: 'This endpoint allows you to toggle the stock status of a product.',
    })
    @ApiParam({ name: 'productId', description: 'ID of the product to toggle stock status', example: 'product-id' })
    @ApiResponse({
      status: 200,
      description: 'Product stock status toggled successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Product stock status updated successfully.' },
          product: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'product123' },
              name: { type: 'string', example: 'Product Name' },
              description:{ type: 'string', example: 'This is a product description' },
              price: { type: 'number', example: 49.99 },
              quantity: { type: 'number', example: 100 },
              categoryName: { type: 'string', example: 'Electronics' },
              images: {
                type: 'array',
                items: { type: 'string' },
              },
              inStock: { type: 'boolean', example: true },
            },
          },
        },
      },
    })
    @ApiResponse({
      status: 403,
      description: 'Forbidden. User does not have the necessary permissions.',
      schema: {
      }
    })
      async toggleProductStock(@Param('productId') productId: string) {
      try {
        // Call the service method to toggle stock status
        const updatedProduct = await this.productService.toggleProductStock(productId);
        
        return {
          message: 'Product stock status updated successfully.',
          product: updatedProduct,
        };
      } catch (error) {
        throw new HttpException(
          { message: 'Error toggling product stock status', error: error.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }    
    

    @Get(':id')
    @ApiOperation({
        summary: 'Get a product record',
        description: 'This endpoint allows you to retrieve a product record.'
      })
      @ApiParam({ name: 'id', description: 'ID of the category to update', example: 'category-id' })
    @ApiResponse({
        status: 200,
        description: 'Get a products',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'product123' },
                name: { type: 'string', example: 'Product Name' },
                description: { type: 'string', example: 'This is a product description' },
                price: { type: 'number', example: 49.99 },
                quantity: { type: 'number', example: 100 },
                categoryName: { type: 'string', example: 'Electronics' },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'img123' },
                      url: { type: 'string', example: 'http://res.cloudinary.com/image.jpg' },
                    },
                  },
                },
                thumbnail: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'thumb123' },
                    url: { type: 'string', example: 'http://res.cloudinary.com/thumbnail.jpg' },
                  },
                },
            },
          },
        },
      })
      @ApiResponse({
        status: 400,
        description: 'Bad Request. Validation error or missing fields.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      })
      @ApiResponse({
        status: 403,
        description: 'Forbidden. User does not have the necessary permissions.',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      })
    getProductById(@Param('id') id: string) {
        return this.productService.getProductById(id);
    }

    @Roles(["admin", "seller"])
    @Delete(':id')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({
        summary: 'Delete a product record',
        description: 'This endpoint allows you to delete a product record.'
      })
    @ApiParam({ name: 'id', description: 'ID of the product to delete', example: 'category-id' })
    @ApiResponse({
      status: 200,
      description: 'Product deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Product deleted successfully' },
        },
      },
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
  
    deleteProduct(@Param('id') id: string, @Req() req: Request) {
      const owner = req.user.id;
        return this.productService.deleteProduct(id, owner);
    }
    
  }
