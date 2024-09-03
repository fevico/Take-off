import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';


@Schema()
export class EmailVerificationToken {

    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'User'})
    owner: MongooseSchema.Types.ObjectId;

    @Prop()
    token: string;

    @Prop({type: Date, default: Date.now, expires: 3600})
    createdAt: Date;
}

export const EmailVerificationTokenSchema = SchemaFactory.createForClass(EmailVerificationToken); // 1