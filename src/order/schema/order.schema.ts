import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';


@Schema({timestamps: true})
export class Order {
    
    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'Product'})
    product: MongooseSchema.Types.ObjectId;

    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'User'})
    user: MongooseSchema.Types.ObjectId;

    @Prop({type: String, required: true})
    email: string;

    @Prop({type: Number, required: true})
    price: number;

    @Prop({type: Number})
    quantity: number;

    @Prop({type: String, required: false})
    paymentReference: string;

    @Prop({type: String, enum:['pending', "confirmed", "cancelled"], default: "pending"})
    status: string;

    @Prop({type: String, required: true})
    address: string;

    @Prop({type: String, required: false})
    phone: string;

    @Prop({type: String})
    paymentStatus: string;

    @Prop({type: Date})
    paidAt: Date;

    @Prop({type: String, enum:["pending", "processing", "shipped", "delivered"], default: "pending"})
    deliveryStatus: string;

    @Prop({type: String, required: false})
    orderNumber: string;
    
}

export const orderSchema = SchemaFactory.createForClass(Order);