import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UploadApiResponse } from 'cloudinary';
import { Model } from 'mongoose';
import cloudUploader from 'src/cloud';
import { Product } from './schema/product.schema';


const uploadImage = (filepath: string): Promise<UploadApiResponse> =>{
    return cloudUploader.upload(filepath,{
         width: 1280,
         height: 720,
         crop: 'fill'
     })
 }

@Injectable()
export class ProductService {

    constructor(
        @InjectModel(Product.name) private productModel: Model<Product>
    ){}

    async createProduct(fields: any, files: any){
    const {name, description, price, categoryId, quantity, brand, seller} = fields
     const {images} = files

     const newProduct = new this.productModel({name, price, categoryId, description, quantity})

 
     let invalidFileType = false
     // if this is the case then we have multiple images
     const isMultipleImages = Array.isArray(images)
     if(isMultipleImages && images.length > 5){
         throw new UnprocessableEntityException('Maximum 5 images are allowed')
     }
     if(isMultipleImages){
         for(let img of images){
             if(!img.mimetype?.startsWith('image')){
                 invalidFileType = true
                 break
             }
         }
     }else{
         if(!images.mimetype?.startsWith('image')){
             invalidFileType = true
     }
 }
     if(invalidFileType) throw new UnprocessableEntityException('Only images are allowd!')
        // FILE UPLOAD
     if(isMultipleImages){
         const uploadPromise = images.map(file =>uploadImage(file.filepath))
         // wait for all the images to be uploaded
         const uploadResults = await Promise.all(uploadPromise)
         // all the image url to the product schma
         newProduct.images = uploadResults.map(({secure_url, public_id}) => {
             return {url: secure_url, id:public_id}
         })
         newProduct.thumbnail = newProduct.images[0].url
     }else{
         if(images){
             const {secure_url, public_id} = await uploadImage(images.filepath) 
             newProduct.images = [{url: secure_url, id: public_id}]
             newProduct.thumbnail = secure_url
         }
     }
     await newProduct.save()
         return newProduct
    }

    async updateProduct(fields: any, files: any, productId: string) {
        const { name, description, price, categoryId, quantity, brand } = fields;
        let { images } = files;
        
        // Find the product in the database
        const product = await this.productModel.findById(productId);
        if (!product) throw new NotFoundException('Product not found');
    
        // Prepare the update data object
        const updateData: any = {};
    
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price) updateData.price = price;
        if (categoryId) updateData.categoryId = categoryId;
        if (quantity) updateData.quantity = quantity;
        if (brand) updateData.brand = brand;
    
        // Validate images
        let invalidFileType = false;
        const isMultipleImages = Array.isArray(images);
        
        if (isMultipleImages && images.length > 5) {
            throw new UnprocessableEntityException('Maximum 5 images are allowed');
        }
    
        if (isMultipleImages) {
            for (let img of images) {
                if (img && !img.mimetype?.startsWith('image')) {
                    invalidFileType = true;
                    break;
                }
            }
        } else {
            if (images && !images.mimetype?.startsWith('image')) {
                invalidFileType = true;
            }
            // If only one image is provided, convert it to an array for uniform processing
            images = images ? [images] : [];
        }
        
        if (invalidFileType) throw new UnprocessableEntityException('Only images are allowed!');
        
        // Delete old images from Cloudinary if new images are provided
        if (images && images.length > 0) {
            for (let img of product.images) {
                await cloudUploader.destroy(img.id);
            }
    
            // Upload new images to Cloudinary
            const uploadedImages = [];
            for (let img of images) {
                const { secure_url: url, public_id: id } = await cloudUploader.upload(
                    img.filepath,
                    {
                        width: 500,
                        height: 500,
                        crop: 'thumb',
                        gravity: 'face',
                    }
                );
                uploadedImages.push({ url, id });
            }
            updateData.images = uploadedImages;
            updateData.thumbnail = uploadedImages[0]?.url; // Set the first image as the thumbnail
        }
    
        // Update the product's details
        const updatedProduct = await this.productModel.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        );
    
        return updatedProduct;
    }
    

    async getAllProducts(){
        const products = await this.productModel.find().populate('categoryId')
        if(!products) throw new NotFoundException('No products found')
        return products
    }

    async getProductById(productId: string){
        const product = await this.productModel.findById(productId).populate('categoryId')
        if(!product) throw new NotFoundException('No product found')
        return product
    }
    async deleteProduct(productId: string) {
        const session = await this.productModel.startSession();
        session.startTransaction();
        
        try {
            const product = await this.productModel.findById(productId);
            if (!product) throw new NotFoundException('No product found');
    
            if (product.images && product.images.length > 0) {
                for (let img of product.images) {
                    await cloudUploader.destroy(img.id);
                }
            }
    
            await this.productModel.findByIdAndDelete(productId);
            await session.commitTransaction();
            session.endSession();
    
            return { message: "Deleted successfully!" };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
    
//     // Find a seller by their MongoDB _id
// const seller = await SellerModel.findById(sellerId);

// // Reference a seller in another schema
// const product = new Product({
//   name: 'Product Name',
//   seller: seller._id, // Reference to the seller
//   // other fields
// });


}
