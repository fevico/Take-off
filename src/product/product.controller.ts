import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UnprocessableEntityException } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {

    constructor(private productService: ProductService) {}

    @Post('create')
    createProduct(@Req() req: Request) {
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
    getAllProducts() {
        return this.productService.getAllProducts();
    }

    @Get(':id')
    getProductById(@Param('id') id: string) {
        return this.productService.getProductById(id);
    }

    @Delete(':id')
    deleteProduct(@Param('id') id: string) {
        return this.productService.deleteProduct(id);
    }
    
}
