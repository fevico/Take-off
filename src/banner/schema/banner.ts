import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({timestamps: true})
export class Banner {
    
  @Prop({type: String, required: true,})
  name: string;

  @Prop({type: String, required: true,})
  description: string;

  @Prop({
    type: {
      url: { type: String, required: true },
      id: { type: String, required: true }
    },
    required: true
  })
  thumbnail: {
    url: string;
    id: string;
}

}

export const bannerSchema = SchemaFactory.createForClass(Banner);