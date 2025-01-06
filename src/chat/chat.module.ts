import { Module } from '@nestjs/common';
import { ChatGateway } from './chat-gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, MessageSchema } from './schema/chat.schema';

@Module({
    imports: [MongooseModule.forFeature([{name: Chat.name, schema: MessageSchema}])],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController]
})
export class ChatModule {}
