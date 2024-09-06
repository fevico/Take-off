import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}
    @Post('create')
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
    getAllCategory(){
        return this.categoryService.getAllCategory()
    }

    @Get(':id')
    getById(@Param('id') id: string){
        return this.categoryService.getCategoryById(id)
    }

    @Delete(':id')
    deleteCategory(@Param('id') id: string){
        return this.categoryService.deleteCategory(id)
    }

    @Patch(':id')
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
