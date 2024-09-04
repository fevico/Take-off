import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from './auth.schema';

@Schema()
export class Seller extends User {

  @Prop({type: String, required: true})
  shopName: string;

  @Prop({type: [String]})
  shopImages: string[];

  @Prop({type: String})
  locationCountry: string;

  @Prop({type: String})
  shopAddress: string;

  // Add any other seller-specific fields here
}

export const sellerSchema = SchemaFactory.createForClass(Seller);
