import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, ObjectId } from 'mongoose';

// export interface BookDoc{
//   _id?: ObjectId;
//   title: string;
//   slug: string;
//   description: string;
//   language: string;
//   publishedAt: Date;
//   publicationName: string;
//   thumbnail: string;
//   averageRating?: number;
// }

@Schema({timestamps: true})
export class Product {
    
  @Prop({type: String, required: true,})
  name: string;

  @Prop({type: String, required: true,})
  description: string;

  @Prop({type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true,})
  categoryId: MongooseSchema.Types.ObjectId;

  @Prop({type: MongooseSchema.Types.ObjectId, ref: 'User'})
  owner: MongooseSchema.Types.ObjectId;

  @Prop({enum:['active', 'inactive', 'outOfStock'], default: 'active'})
  status: string;

  @Prop({type: Number, required: true,})
  price: number;

  @Prop({type: Number, required: true,})
  quantity: number;

  @Prop({type: Number})
  totalSale: number;

  @Prop({type: Boolean, default: true})
  inStock: boolean;

  @Prop({
    type:[{
    url: {type: String, required: true},
    id:{type: String, required: true}
}],
})

images:{url: string, id: string}[]

  @Prop({type: String, required: true })
  thumbnail: string;

  @Prop({type: Number, required: false, default: 0})
  averageRating: number;

  @Prop({type: Date, default : Date.now})
  createdAt: Date;

}

export const productSchema = SchemaFactory.createForClass(Product);