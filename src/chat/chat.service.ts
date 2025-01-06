import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from './schema/chat.schema';

@Injectable()
// export class ChatService {
//   constructor(@InjectModel(Chat.name) private messageModel: Model<Chat>) {}

//   async saveMessage(data: {
//     sender: string;
//     receiver: string;
//     room: string;
//     content: string;
//   }) {
//     const message = new this.messageModel(data);
//     return message.save();
//   }

//   async getMessagesByRoom(room: string) {
//     return this.messageModel.find({ room }).sort({ timestamp: 1 }).exec();
//   }
// }
export class ChatService {
  constructor(@InjectModel(Chat.name) private messageModel: Model<Chat>) {}

  generateRoomId(sender: string, receiver: string): string {
    // Sort the IDs to ensure consistency in the room ID
    const [first, second] = [sender, receiver].sort();
    return `${first}_${second}`;
  }

  async saveMessage(data: {
    sender: string;
    receiver: string;
    content: string;
  }) {
    const room = this.generateRoomId(data.sender, data.receiver);
    const message = new this.messageModel({ ...data, room });
    return message.save();
  }

  async getMessagesByRoom(room: string) {
    return this.messageModel.find({ room }).sort({ timestamp: 1 }).exec();
  }
}

