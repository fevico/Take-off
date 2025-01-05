import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, ObjectId, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; // Single product per order

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId; // Track the seller for this order

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: String, required: false })
  paymentReference: string;

  @Prop({ type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' })
  status: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: String, required: false })
  phone: string;

  @Prop({ type: String, required: false })
  note: string;

  @Prop({ type: Date })
  shippedDate: Date;

  @Prop({ type: Date })
  deliveredDate: Date;

  @Prop({ type: Date })
  receivedDate: Date;

  @Prop({ type: String, enum: ['paid', 'unpaid'], default: 'unpaid' })
  paymentStatus: string;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: String, enum: ['pending', 'accepted', 'shipped', 'delivered'], default: 'pending' })
  deliveryStatus: string;

  @Prop({ type: String, required: false })
  orderNumber: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
