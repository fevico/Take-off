import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Category {
    
  @Prop({type: String, required: true,})
  name: string;

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

export const categorySchema = SchemaFactory.createForClass(Category);