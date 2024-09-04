import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class User {
    
  @Prop({type: String, required: true, unique: true})
  email: string;

  @Prop({type: String})
  password: string;

  @Prop({type: String})
  name: string;

  @Prop({type: Number})
  phone: number;

  @Prop({type: String})
  address: string;

  @Prop({
    type: {
      url: { type: String, required: true },
      id: { type: String, required: true }
    },
  
  })
  avatar: {
    url: string;
    id: string;
}

  @Prop({type: Boolean, default: false})
  isVerified: boolean;

  @Prop({ required: true, enum: ['admin', 'buyer', 'seller'], default: 'buyer' })
  role: string;

}

export const userSchema = SchemaFactory.createForClass(User);