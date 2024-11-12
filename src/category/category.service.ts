import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './schema/category.schema';
import { Model } from 'mongoose';
import { UploadApiResponse } from 'cloudinary';
import cloudUploader from 'src/cloud';

const uploadImage = (filepath: string): Promise<UploadApiResponse> => {
  return cloudUploader.upload(filepath, {
    width: 1280,
    height: 720,
    crop: 'fit', // use 'fit' to maintain aspect ratio
  });
};

// const uploadImage = (filepath: string): Promise<UploadApiResponse> => {
//   return cloudUploader.upload(filepath, {
//     width: 1280,
//     height: 720,
//     crop: 'limit', // limits size without cropping or stretching
//   });
// };


@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async createCategory(body: any, files: any) {
    const { name } = body;
    let { thumbnail } = files;
    console.log('Service method started');

    try {
      if (!thumbnail) {
        throw new UnprocessableEntityException('Image is required');
      }

      // Ensure `thumbnail` is not an array with more than one element
      if (Array.isArray(thumbnail)) {
        if (thumbnail.length > 1) {
          throw new UnprocessableEntityException(
            'Multiple files are not allowed!',
          );
        }
        // If `thumbnail` is an array with one element, extract that element
        thumbnail = thumbnail[0];
      }

      // Check that the uploaded file is an image
      if (!thumbnail.mimetype?.startsWith('image')) {
        throw new UnprocessableEntityException(
          'Invalid file type, only images are allowed',
        );
      }

      const { secure_url, public_id } = await uploadImage(thumbnail.filepath);
      const imageUrl = { url: secure_url, id: public_id };
      const category = new this.categoryModel({
        name,
        thumbnail: imageUrl, // Assign the uploaded image URL to the thumbnail field
      });
      category.thumbnail = imageUrl;
      console.log('Category to be saved:', category);
      await category.save();
      return { status: true, statusCode: 200, category };

    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }

  async getAllCategory() {
    try { 
      const category = await this.categoryModel.find();
      if (!category) throw new NotFoundException('Category not found');
      return {status: true, statusCode: 200, category};
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async getCategoryById(id: string) {
    try {
      const category = await this.categoryModel.findById(id);
      if (!category) throw new NotFoundException('Category not found');
      return {status: true, category};
      
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async deleteCategory(id: string) {

    try {
          // First, retrieve the category
    const category = await this.categoryModel.findById(id);

    // Check if the category exists
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // If the category has an associated thumbnail, delete it from Cloudinary
    if (category.thumbnail?.id) {
      await cloudUploader.destroy(category.thumbnail.id);
    }

    // After deleting the image, delete the category itself
    await this.categoryModel.findByIdAndDelete(id);

    return {status: true, message: 'Category deleted successfully'};
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }

  }

  async updateCategory(catId: string, fields: any, files: any) {
    const { name } = fields;
    let { thumbnail } = files;

    try {
      if (Array.isArray(thumbnail)) {
        if (thumbnail.length > 1) {
          throw new UnprocessableEntityException(
            'Multiple files are not allowed!',
          );
        }
        thumbnail = thumbnail[0];
      }
  
      if (thumbnail && !thumbnail.mimetype?.startsWith('image')) {
        throw new UnprocessableEntityException('Only images are allowed');
      }
  
      // Find the category
      const category = await this.categoryModel.findById(catId).exec();
      if (!category) throw new NotFoundException('Category not found');
  
      if (files.thumbnail) {
        if (category.thumbnail?.id) {
          // Remove existing thumbnail file from cloud storage
          await cloudUploader.destroy(category.thumbnail.id);
        }
      }
  
      // Upload new image if thumbnail exists
      let newThumbnail = category.thumbnail; // Keep old thumbnail if no new image is provided
      if (thumbnail) {
        const { secure_url: url, public_id: id } = await cloudUploader.upload(
          thumbnail.filepath,
          {
            width: 300,
            height: 300,
            crop: 'thumb',
            gravity: 'face',
          },
        );
        newThumbnail = { url, id };
      }
  
      // Update the category
      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(
          catId,
          { name, thumbnail: newThumbnail },
          { new: true },
        )
        .exec();
  
      return {status: true, statusCode: 200, result: updatedCategory };
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }

  }
}
