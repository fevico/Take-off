// import { Body, Controller, Get, Param, Post } from '@nestjs/common';
// import { ChatService } from './chat.service';

// @Controller('chat')
// export class ChatController {
//   constructor(private readonly chatService: ChatService) {}

//   @Get('room/:room')
//   async getMessagesByRoom(@Param('room') room: string) {
//     return this.chatService.getMessagesByRoom(room);
//   }


// //   @Post('room/:room/message')
// // async sendMessage(@Param('room') room: string, @Body() { message, senderId }: { message: string; senderId: string }) {
// //   const savedMessage = await this.chatService.saveMessage(room, message, senderId);
// //   this.chatGateway.server.to(room).emit('message', savedMessage); // Broadcast to the room via WebSocket
// //   return savedMessage;
// // }

// }


import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

}
