import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/role.decorator';
import { AuthenticationGuard } from 'src/guards/Authentication';
import { AuthorizationGuard } from 'src/guards/Authorization';


@ApiTags('Category')
@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @ApiBearerAuth()
    @Roles(['admin'])
    @Post('create')
    @UseGuards(AuthenticationGuard, AuthorizationGuard)
    @ApiOperation({
        summary: 'Create a new category record',
        description: 'This endpoint allows you to create a new category with the specified name and thumbnail and thumbnail as a file.'
      })
    @ApiBody({
        description: 'Create a new category with a name and thumbnail',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Electronics' },
            thumbnail: {
              type: 'object',
              properties: {
                url: { type: 'string', example: 'https://res.cloudinary.com/example/image/upload/v1/sample.jpg' },
                id: { type: 'string', example: 'sample-image-id' },
              },
              required: ['url', 'id'],
            },
          },
          required: ['name', 'thumbnail'],
        },
      })
      @ApiResponse({
        status: 201,
        description: 'Category successfully created',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'category-id' },
            name: { type: 'string', example: 'Electronics' },
            thumbnail: {
              type: 'object',
              properties: {
                url: { type: 'string', example: 'https://res.cloudinary.com/example/image/upload/v1/sample.jpg' },
                id: { type: 'string', example: 'sample-image-id' },
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
    createCategory(@Req() req: Request) {
        const fields = req.body as Record<string, any>; // Use a more specific type if possible
        const files = req['files'] as Record<string, any>;
    
        // Check and convert if fields.name is an array
        if (Array.isArray(fields.name)) {
          fields.name = fields.name[0];
        }    
  
      // Pass fields and files to the service method
       return this.categoryService.createCategory(fields, files);
    }

    @Get('all')
    @ApiOperation({
        summary: 'Get all category record',
        description: 'This endpoint allows you to retrieve all category record.'
      })
    @ApiResponse({
        status: 200,
        description: 'Get all categories',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'category-id' },
              name: { type: 'string', example: 'Electronics' },
              thumbnail: {
                type: 'object',
                properties: {
                  url: { type: 'string', example: 'https://res.cloudinary.com/example/image/upload/v1/sample.jpg' },
                  id: { type: 'string', example: 'sample-image-id' },
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
    
    getAllCategory(){
        return this.categoryService.getAllCategory()
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a category record',
        description: 'This endpoint allows you to retrieve a category record.'
      })
    @ApiParam({ name: 'id', description: 'ID of the category to retrieve', example: 'category-id' })
    @ApiResponse({
      status: 200,
      description: 'Category retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'category-id' },
          name: { type: 'string', example: 'Electronics' },
          thumbnail: {
            type: 'object',
            properties: {
              url: { type: 'string', example: 'https://res.cloudinary.com/example/image/upload/v1/sample.jpg' },
              id: { type: 'string', example: 'sample-image-id' },
            },
          },
        },
      },
    })
    @ApiResponse({ status: 404, description: 'Category not found' })
  
    getById(@Param('id') id: string){
        return this.categoryService.getCategoryById(id)
    }

    @Roles(['admin'])
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a category record',
        description: 'This endpoint allows you to delete all category record.'
      })
    @ApiParam({ name: 'id', description: 'ID of the category to delete', example: 'category-id' })
    @ApiResponse({
      status: 200,
      description: 'Category deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Category deleted successfully' },
        },
      },
    })
    @ApiResponse({ status: 404, description: 'Category not found' })
  
    deleteCategory(@Param('id') id: string){
        return this.categoryService.deleteCategory(id)
    }

    @Roles(['admin'])
    @Patch(':id')
    @ApiOperation({
        summary: 'Update a category record',
        description: 'This endpoint allows you to update a category record.'
      })
      @ApiParam({ name: 'id', description: 'ID of the category to update', example: 'category-id' })
      @ApiBody({
        description: 'Update category with a name and thumbnail',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Electronics' },
            thumbnail: {
              type: 'object',
              properties: {
                url: { type: 'string', example: 'https://res.cloudinary.com/example/image/upload/v1/sample.jpg' },
                id: { type: 'string', example: 'sample-image-id' },
              },
              required: ['url', 'id'],
            },
          },
          required: ['name', 'thumbnail'],
        },
      })
      @ApiResponse({
        status: 200,
        description: 'Category updated successfully',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'category-id' },
            name: { type: 'string', example: 'Updated Electronics' },
            thumbnail: {
              type: 'object',
              properties: {
                url: { type: 'string', example: 'https://res.cloudinary.com/example/image/upload/v1/updated-sample.jpg' },
                id: { type: 'string', example: 'updated-sample-image-id' },
              },
            },
          },
        },
      })
      @ApiResponse({ status: 404, description: 'Category not found' })
    
    updateCategory(@Param('id') id: string, @Req() req: Request){
        const fields = req.body as Record<string, any>; // Use a more specific type if possible
        const files = req['files'] as Record<string, any>;
    
        // Check and convert if fields.name is an array
        if (Array.isArray(fields.name)) {
          fields.name = fields.name[0];
        }    


        return this.categoryService.updateCategory(id, fields, files)
    }
}
