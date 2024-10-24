import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UnprocessableEntityException } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Product')
@Controller('product')
export class ProductController {

    constructor(private productService: ProductService) {}

    @Post('create')
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
    
        return this.productService.createProduct(fields, files);
    }

    @Patch('update/:id')
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
    
        return this.productService.updateProduct(fields, files, id);

    }

    @Get('all') 
    @ApiOperation({
        summary: 'Get all product record',
        description: 'This endpoint allows you to retrieve all product record.'
      })
    @ApiResponse({
        status: 200,
        description: 'Get all products',
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
    
    getAllProducts() {
        return this.productService.getAllProducts();
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

    @Delete(':id')
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
  
    deleteProduct(@Param('id') id: string) {
        return this.productService.deleteProduct(id);
    }
    
}
