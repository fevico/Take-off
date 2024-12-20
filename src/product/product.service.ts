import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UploadApiResponse } from 'cloudinary';
import { isValidObjectId, Model } from 'mongoose';
import cloudUploader from 'src/cloud';
import { Product } from './schema/product.schema';


const uploadImage = (filepath: string): Promise<UploadApiResponse> =>{
    return cloudUploader.upload(filepath,{
         width: 1080 ,
         height: 1080 ,
        crop: 'fill'
     })
 }

 interface PopulatedCategory {
    name: string
}

@Injectable()
export class ProductService {

    constructor(
        @InjectModel(Product.name) private productModel: Model<Product>
    ){}

    async createProduct(fields: any, files: any, owner: string){
    const {name, description, price, categoryId, quantity, brand, seller} = fields
     const {images} = files

     try {
        const newProduct = new this.productModel({name, price, categoryId, description, quantity, owner})
 
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
     if(invalidFileType) throw new UnprocessableEntityException('Only images are allowed!')
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
         return {status: true, statusCode: 201, newProduct}

     } catch (error) {
        throw new UnprocessableEntityException(error.message)
     }
}

    async updateProduct(fields: any, files: any, productId: string, owner: string) {
        const { name, description, price, categoryId, quantity, brand } = fields;
        let { images } = files;

        try {
            const productOwner = await this.productModel.findOne({owner});
            if (!productOwner) throw new UnprocessableEntityException('You are not authorized to update this product');
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
        } catch (error) {
            throw new UnprocessableEntityException(error.message)
        }
        
    }
    
    async getAllProducts() {
        const products = await this.productModel
          .find()
          .populate<{ categoryId: PopulatedCategory }>({
            path: 'categoryId',
            select: 'name', // select only the name field
          });
      
        if (!products || products.length === 0) {
          throw new NotFoundException('No products found');
        }
      
        // Map through the products array and return the desired structure
        return products.map((product) => ({
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          images: product.images,
          thumbnail: product.thumbnail,
          categoryName: product.categoryId ? product.categoryId.name : 'No category', // Handle missing categoryId
        }));
      }

    async getProductById(productId: string){
        try {
            const product = await this.productModel.findById(productId).populate<{categoryId: PopulatedCategory}>({path: "categoryId", select: "name"})
            if(!product) throw new NotFoundException('No product found')
            return {
                status: true,
                message: "Product found",
                data: {
                    id: product._id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    quantity: product.quantity,
                    images: product.images,
                    thumbnail: product.thumbnail,
                    categoryName: product.categoryId ? product.categoryId.name : 'No category', // Handle missing categoryId
                }
            } 
        } catch (error) {
            throw new UnprocessableEntityException(error.message)
        }
        
    }

    async deleteProduct(productId: string, owner: string) {
        const session = await this.productModel.startSession();
        session.startTransaction();
        
        try {
            const product = await this.productModel.findOne({_id: productId, owner: owner});
            if (!product) throw new UnprocessableEntityException('Product not found / You are not authorized to delete this product!');
    
            if (product.images && product.images.length > 0) {
                for (let img of product.images) {
                    await cloudUploader.destroy(img.id);
                }
            }
    
            await this.productModel.findByIdAndDelete(productId);
            await session.commitTransaction();
            session.endSession();
    
            return {status: true, statusCode: 201, message: "Deleted successfully!" };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new UnprocessableEntityException(error.message);
        }
    }
    
    async searchProduct(searchQuery: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
      
        // Build the search query using a regular expression
        const query = {
          name: { $regex: searchQuery, $options: 'i' },
        };
      
        try {
          // Fetch matching products with pagination and populate `categoryId`
          const products = await this.productModel
            .find(query)
            .populate<{categoryId: PopulatedCategory}>({ path: 'categoryId', select: 'name' })
            .skip(skip)
            .limit(limit)
            .select('name price description thumbnail categoryId')
            .exec();
      
          // Count total matching documents for pagination metadata
          const totalProducts = await this.productModel.countDocuments(query);
          
          const result = products.map((product) => ({
            id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            quantity: product.quantity,
            thumbnail: product.thumbnail,
            categoryName: product.categoryId ? product.categoryId.name : 'No category',
          }))
      
          return {
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalItems: totalProducts,
              },
            result,

          };
        } catch (error) {
          console.error('Error searching products:', error);
          throw new Error('An error occurred while searching for products.');
        }
      }

      async toggleProductStock(productId: string) {
        // Validate the product ID
        if (!isValidObjectId(productId)) {
          throw new BadRequestException('Invalid product ID.');
        }
      
        // Find the product by ID
        const product = await this.productModel.findById(productId);
        if (!product) {
          throw new NotFoundException('Product not found.');
        }
      
        // Toggle the `inStock` field
        product.inStock = !product.inStock;
      
        // Save the updated product
        const updatedProduct = await product.save();
      
        return updatedProduct;
      }
      
      
    async getFeaturedProducts(){
            const featuredProducts = await this.productModel.find()
              .sort({ createdAt: -1 })
              .limit(10); 
            return featuredProducts;
          };

    async getProductsByUser(user: string){
        const products = await this.productModel.find({owner: user});
        if(!products || products.length === 0) throw new NotFoundException('No products found for this user!');
        return products;
    }
}
