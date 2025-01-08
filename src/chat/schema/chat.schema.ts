import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Chat extends Document {
  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  receiver: string;

  @Prop({ required: true })
  room: string;

  @Prop({ required: true })
  message: string;


  @Prop({ default: Date.now })
  timestamp: Date;
}


export const MessageSchema = SchemaFactory.createForClass(Chat);
