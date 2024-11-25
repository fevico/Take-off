import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Banner } from './schema/banner';
import { Model } from 'mongoose';
import cloudUploader from 'src/cloud';
import { UploadApiResponse } from 'cloudinary';

const uploadImage = (filepath: string): Promise<UploadApiResponse> => {
    return cloudUploader.upload(filepath, {
      width: 1500,
      height: 1500,
      crop: 'fill',
    });
  };

@Injectable()
export class BannerService {
    constructor(@InjectModel(Banner.name) private bannerModel: Model<Banner>) { }

    async createBanner(body: any, files: any) {
        const { name, description } = body;
    let { thumbnail } = files;

    try {
      if (!thumbnail) {
        throw new UnprocessableEntityException('Thumbnail is required');
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
      const banner = new this.bannerModel({
        name,
        description,
        thumbnail: imageUrl, // Assign the uploaded image URL to the thumbnail field
      });
      banner.thumbnail = imageUrl;
      await banner.save();
      return { status: true, statusCode: 200, banner };

    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    } 
    }
}
