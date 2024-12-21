import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';


@Schema({timestamps: true})
export class Review {

  @Prop({type: MongooseSchema.Types.ObjectId, ref: 'User', required: true,})
  user: MongooseSchema.Types.ObjectId;

  @Prop({type: MongooseSchema.Types.ObjectId, ref: 'Product'})
  product: MongooseSchema.Types.ObjectId;

  @Prop({type: String, required: true})
  content: string;

  @Prop({type: Number, required: true})
  rating: number;
}

export const reviewSchema = SchemaFactory.createForClass(Review);