
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/guards/Authentication';


@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('all-chats')
  @UseGuards(AuthenticationGuard)
  @ApiOperation({ summary: 'Fetch All User Chats' })
  async getUserChats(@Req() req: Request) {
    const userId = req.user.id;
    return this.chatService.getUserChats(userId);
  }
}
