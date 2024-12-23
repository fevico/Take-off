import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from 'mongoose';

// Define CartItem as a sub-schema
@Schema()
export class CartItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  price: number;
}

// Create the CartItem schema first
const CartItemSchema = SchemaFactory.createForClass(CartItem);

// Main Order schema
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: [CartItemSchema], required: true })
  cartItems: CartItem[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Number, required: true })
  price: number;

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

  @Prop({ type: String, required: true, default: 'pending' })
  paymentStatus: string;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: String, enum: ['pending', 'processing', 'shipped', 'delivered'], default: 'pending' })
  deliveryStatus: string;

  @Prop({ type: String, required: false })
  orderNumber: string;
}

// Create the Order schema after CartItemSchema
export const OrderSchema = SchemaFactory.createForClass(Order);
