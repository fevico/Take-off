import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Cart {
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        product: { type: MongooseSchema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true, default: 1 }
      }
    ],
    // default: []
  })
  items: Array<{
    product: Types.ObjectId;
    quantity: number;
  }>;

}

export const CartSchema = SchemaFactory.createForClass(Cart);
