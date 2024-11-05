import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';


@Schema({timestamps: true})
export class Payment {
    
    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'Product'})
    product: MongooseSchema.Types.ObjectId;

    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'User'})
    user: MongooseSchema.Types.ObjectId;

    @Prop({type: String, required: true})
    name: string;

    @Prop({type: String, required: true})
    email: string;

    @Prop({type: Number, required: true})
    price: number;

    @Prop({type: Number, required: true})
    quantity: number;

    @Prop({type: String, required: false})
    paymentStatus: string;

    @Prop({type: String, required: false})
    paymentReference: string;

    @Prop({type: String, required: false})
    orderNumber: string;
}

export const paymentSchema = SchemaFactory.createForClass(Payment);