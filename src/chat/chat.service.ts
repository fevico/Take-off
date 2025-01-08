

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from './schema/chat.schema';
import { User } from '../auth/schema/auth.schema';


@Injectable()
export class ChatService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Chat.name) private messageModel: Model<Chat>) { }



  async saveMessage(data: { room: string; sender: string; receiver: string; message: string, timestamp: string }) {
    const message = new this.messageModel(data);
    return message.save();
  }


  async getMessagesByRoom(room: string) {
    return this.messageModel.find({ room }).sort({ timestamp: 1 }).exec();
  }


  async getUserChats(userId: string) {
    // Fetch all messages where the user is either the sender or receiver
    const chats = await this.messageModel
      .find({ $or: [{ sender: userId }, { receiver: userId }] })
      .sort({ timestamp: -1 }); // Sort by timestamp (latest first)

    if (!chats || chats.length === 0) {
      throw new NotFoundException('No chats found for this user!');
    }

    // Group messages by room and get the last message in each room
    const groupedChats = chats.reduce((acc, chat) => {
      if (!acc[chat.room]) {
        acc[chat.room] = chat; // Store the latest message (sorted above)
      }
      return acc;
    }, {});

    // Prepare chat data with receiver info and last message details
    const chatData = await Promise.all(
      Object.values(groupedChats).map(async (chat: Chat) => {
        const isSender = chat.sender === userId;
        const receiverId = isSender ? chat.receiver : chat.sender;

        // Fetch receiver info from userModel
        const receiver = await this.userModel.findById(receiverId).select('name avatar.url');

        return {
          room: chat.room,
          receiverId,
          receiverName: receiver?.name || 'Unknown User',
          receiverAvatar: receiver?.avatar?.url || null,
          lastMessage: chat.message,
          lastMessageTimestamp: chat.timestamp,
        };
      }),
    );

    return chatData;
  }

}
