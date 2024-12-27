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

export interface PopulatedCategory {
    name: string
    _id: string
}

export interface PaginatedResponse<T> {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    data: T[];
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
    
    async getAllProducts(page: number, limit: number) {
      // Convert page and limit to numbers
      page = Math.max(1, Number(page));
      limit = Math.max(1, Number(limit));
    
      const skip = (page - 1) * limit;
    
      // Fetch products with pagination
      const [products, totalItems] = await Promise.all([
        this.productModel
          .find()
          .skip(skip)
          .limit(limit)
          .populate<{ categoryId: PopulatedCategory }>({
            path: 'categoryId',
            select: 'name',
          }),
        this.productModel.countDocuments(),
      ]);
    
      if (!products || products.length === 0) {
        throw new NotFoundException('No products found');
      }
    
      // Map through the products array and return the desired structure
      const data = products.map((product) => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        images: product.images,
        thumbnail: product.thumbnail,
        categoryName: product.categoryId ? product.categoryId.name : 'No category', // Handle missing categoryId
      }));
    
      return {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        data,
      };
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
                    inStock: product.inStock,
                    categoryId: product.categoryId,
                    createdAt: product.createdAt,
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
    
    // async searchProduct(searchQuery: string, page: number, limit: number) {
    //     const skip = (page - 1) * limit;
      
    //     // Build the search query using a regular expression
    //     const query = {
    //       name: { $regex: searchQuery, $options: 'i' },
    //     };
      
    //     try {
    //       // Fetch matching products with pagination and populate `categoryId`
    //       const products = await this.productModel
    //         .find(query)
    //         .populate<{categoryId: PopulatedCategory}>({ path: 'categoryId', select: 'name' })
    //         .skip(skip)
    //         .limit(limit)
    //         .select('name price description thumbnail categoryId')
    //         .exec();
      
    //       // Count total matching documents for pagination metadata
    //       const totalProducts = await this.productModel.countDocuments(query);
          
    //       const result = products.map((product) => ({
    //         id: product._id,
    //         name: product.name,
    //         description: product.description,
    //         price: product.price,
    //         quantity: product.quantity,
    //         thumbnail: product.thumbnail,
    //         categoryName: product.categoryId ? product.categoryId.name : 'No category',
    //       }))
      
    //       return {
    //         pagination: {
    //             currentPage: page,
    //             totalPages: Math.ceil(totalProducts / limit),
    //             totalItems: totalProducts,
    //           },
    //         result,

    //       };
    //     } catch (error) {
    //       console.error('Error searching products:', error);
    //       throw new Error('An error occurred while searching for products.');
    //     }
    //   }

    async getProducts(filters: {
      searchQuery?: string;
      categories?: string[];
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      outOfStock?: boolean;
      sort?: string;
      page: number;
      limit: number;
    }) {
      const { searchQuery, categories, minPrice, maxPrice, inStock, sort, page, limit, outOfStock } = filters;
    
      const skip = (page - 1) * limit;
      const query: any = {};
    
      // Add search query
      if (searchQuery) {
        query.name = { $regex: searchQuery, $options: 'i' };
      }
    
      // Add category filter for multiple categories
      if (categories && categories.length > 0) {
        query.categoryId = { $in: categories }; // Match any of the categories
      }
    
      // Add price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
      }
    
      // Add inStock filter if provided
      if (inStock !== undefined) {
        query.inStock = true; // Handle true or false based on user input
      }
      if (outOfStock !== undefined) {
        query.inStock = false; // Handle true or false based on user input
      }
    
      // Determine sort order
      const sortOptions: Record<string, any> = {
        newest: { createdAt: -1 }, // Sort by newest products
        alphabetical: { name: 1 }, // Sort by name alphabetically
        priceLowToHigh: { price: 1 }, // Sort by price low to high
        priceHighToLow: { price: -1 }, // Sort by price high to low
      };
      const sortOrder = sortOptions[sort] || { createdAt: -1 }; // Default to newest if sort is not provided
    
      try {
        // Fetch products with filters, pagination, and sorting
        const products = await this.productModel
          .find(query)
          .populate<{ categoryId: PopulatedCategory }>({ path: 'categoryId', select: 'name' })
          .sort(sortOrder)
          .skip(skip)
          .limit(limit)
          .select('name price description thumbnail categoryId')
          .exec();
    
        // Count total matching documents for pagination metadata
        const totalProducts = await this.productModel.countDocuments(query);
    
        const result = products.map((product) => ({
          id: product._id,
          name: product.name,
          price: product.price,
          thumbnail: product.thumbnail,
          categoryName: product.categoryId ? product.categoryId.name : 'No category',
          categoryId: product.categoryId ? product.categoryId._id : null,
        }));
    
        return {
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalItems: totalProducts,
          },
          result,
        };
      } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('An error occurred while fetching products.');
      }
    }
    

      
      // async filterProduct(
      //   categoryId?: string,
      //   minPrice?: number,
      //   maxPrice?: number,
      //   page = 1,
      //   limit = 10,
      // ): Promise<PaginatedResponse<PopulatedCategory>> {
      //   const query: any = {};
    
      //   // Add filters to the query dynamically
      //   if (categoryId) {
      //     query.categoryId = categoryId;
      //   }
      //   if (minPrice !== undefined) {
      //     query.price = { ...query.price, $gte: minPrice };
      //   }
      //   if (maxPrice !== undefined) {
      //     query.price = { ...query.price, $lte: maxPrice };
      //   }
    
      //   // Pagination calculations
      //   const skip = (page - 1) * limit;
    
      //   // Execute query with filters and pagination
      //   const products = await this.productModel
      //     .find(query)
      //     .populate<{categoryId: PopulatedCategory}>({ path: 'categoryId', select: 'name' })
      //     .skip(skip)
      //     .limit(limit)
      //     .exec();

      //     const result = products.map((product) => ({
      //       id: product._id,
      //       name: product.name,
      //       price: product.price,
      //       quantity: product.quantity,
      //       thumbnail: product.thumbnail,
      //       categoryName: product.categoryId ? product.categoryId.name : 'No category',
      //     }))
    
      //   const total = await this.productModel.countDocuments(query);
    
      //   return {
      //       currentPage: page,
      //       totalPages: Math.ceil(total / limit),
      //       totalItems: total,
      //       data: result,
      //   };
      // }
    

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
      
      async getFeaturedProducts() {
        try {
          // Fetch 20 random products
          const randomProducts = await this.productModel.aggregate([
            { $sample: { size: 20 } }, // Select 20 random products
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                description: 1,
                thumbnail: 1,
                categoryId: 1,
                category: 1
              }, // Select fields to return
            },
          ]);
      
          // Populate category details if needed
          const populatedProducts = await this.productModel.populate<{categoryId: PopulatedCategory}>(randomProducts, {
            path: 'categoryId',
            select: 'name',
          });
      
          const result = populatedProducts.map((product) => ({
            id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            thumbnail: product.thumbnail,
            categoryName: product.categoryId?.name || 'No category',
            categoryId: product.categoryId?._id,
          }));
      
          return result;
        } catch (error) {
          console.error('Error fetching random products:', error);
          throw new Error('An error occurred while fetching random products.');
        }
      }
      
    // async getFeaturedProducts() {
    //         try {
    //           // Fetch 20 random products where `isFeatured` is true
    //           const featuredProducts = await this.productModel.aggregate([
    //             { $match: { isFeatured: true } }, // Filter only featured products
    //             { $sample: { size: 20 } }, // Select 20 random products
    //             {
    //               $project: {
    //                 _id: 1,
    //                 name: 1,
    //                 price: 1,
    //                 description: 1,
    //                 thumbnail: 1,
    //                 categoryId: 1,
    //               }, // Select fields to return
    //             },
    //           ]);
          
    //           // Populate category details if needed
    //           const populatedProducts = await this.productModel.populate<{categoryId: PopulatedCategory}>(featuredProducts, {
    //             path: 'categoryId',
    //             select: 'name',
    //           });
          
    //           // Map results to format the response
    //           const result = populatedProducts.map((product) => ({
    //             id: product._id,
    //             name: product.name,
    //             description: product.description,
    //             price: product.price,
    //             thumbnail: product.thumbnail,
    //             categoryName: product.categoryId?.name || 'No category',
    //           }));
          
    //           return result;
    //         } catch (error) {
    //           console.error('Error fetching featured products:', error);
    //           throw new Error('An error occurred while fetching featured products.');
    //         }
    // }
          
    async getProductsByUser(user: string, page: number, limit: number) {
      const skip = (page - 1) * limit; // Calculate the number of documents to skip
    
      // Fetch products with pagination
      const products = await this.productModel
        .find({ owner: user })
        .populate<{ categoryId: PopulatedCategory }>({ path: 'categoryId', select: 'name' })
        .skip(skip)
        .limit(limit);
    
      // Count total products for the user
      const totalProducts = await this.productModel.countDocuments({ owner: user });
    
      if (!products || products.length === 0) {
        throw new NotFoundException('No products found for this user!');
      }
    
      const productOwner = products.map((product) => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        thumbnail: product.thumbnail,
        categoryName: product.categoryId?.name || 'No category',
        categoryId: product.categoryId?._id,
      }));
    
      return {
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalProducts / limit),
          totalItems: totalProducts,
        },
        result: productOwner,
      };
    }
    
}
