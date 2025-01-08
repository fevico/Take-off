

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from './schema/chat.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private messageModel: Model<Chat>) { }

 
  async saveMessage(data: { room: string; sender: string; receiver: string; message: string, timestamp: string }) {
    const message = new this.messageModel(data);
    return message.save();
  }


  async getMessagesByRoom(room: string) {
    return this.messageModel.find({ room }).sort({ timestamp: 1 }).exec();
  }
}
