import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';


@Schema({timestamps: true})
export class Order {
    
    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'Product'})
    product: MongooseSchema.Types.ObjectId;

    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'User'})
    user: MongooseSchema.Types.ObjectId;

    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'Payment'})
    payment: MongooseSchema.Types.ObjectId;

    @Prop({type: String, required: true})
    name: string;

    @Prop({type: String, required: true})
    email: string;

    @Prop({type: Number, required: true})
    price: number;

    @Prop({type: Number, required: true})
    quantity: number;

    @Prop({type: String, enum:['pending', "confirmed", "cancelled"]})
    status: string;

    @Prop({type: String, required: true})
    address: string;

    @Prop({type: String, required: false})
    phone: string;

    @Prop({type: String, required: false})
    paymentStatus: string;

    @Prop({type: String, enum:["pending", "processing", "shipped", "delivered"], default: "pending"})
    deliveryStatus: string;

    @Prop({type: String, required: false})
    orderNumber: string;
}

export const orderSchema = SchemaFactory.createForClass(Order);