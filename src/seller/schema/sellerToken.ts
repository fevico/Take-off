import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';


@Schema({timestamps: true})
export class SellerVerificationToken {

    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'User'})
    owner: MongooseSchema.Types.ObjectId;

    @Prop({type: String, required: true})
    token: string;

    @Prop({type: Date, default: Date.now, expires: 3600})
    createdAt: Date;
}

export const SellerVerificationTokenSchema = SchemaFactory.createForClass(SellerVerificationToken); // 1