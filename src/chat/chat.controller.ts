import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('room/:room')
  async getMessagesByRoom(@Param('room') room: string) {
    return this.chatService.getMessagesByRoom(room);
  }
}
