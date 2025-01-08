import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from "socket.io"
import { ChatService } from "./chat.service";

@WebSocketGateway(3003, { cors: { origin: "*" } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) { }

  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    console.log("client connected", client.id);
    client.emit("connected", { message: "You are connected to the server" });
  }

  handleDisconnect(client: Socket) {
    console.log("client disconnected", client.id);
  }


  @SubscribeMessage("joinRoom")
  handleJoinRoom(client: Socket, payload: { senderId: string; receiverId: string }) {
    const room = [payload.senderId, payload.receiverId].sort().join("-");
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);
    this.server.to(room).emit("user-joined", {
      message: `User ${client.id} joined the room.`,
    });
  }



  @SubscribeMessage("newMessage")
  async handleMessage(client: Socket, payload: { room: string; message: string; sender: string; receiver: string; timestamp?: string }) {
    const { room, message, sender, receiver } = payload;
    const timestamp = payload.timestamp || new Date().toISOString();

    if (!room || !message.trim() || !sender || !receiver) {
      client.emit("error", { message: "Invalid message payload" });
      return;
    }

    try {
      // Save message to the database
      await this.chatService.saveMessage({ room, sender, receiver, message, timestamp });

      console.log(`Message from ${sender} to room ${room}: ${message}`);
      // Broadcast the message to the room
      this.server.to(room).emit("newMessage", { sender, receiver, message, timestamp });



    } catch (error) {
      console.error("Error saving or emitting message:", error);
      client.emit("error", { message: "Failed to send message" });
    }
  }



  @SubscribeMessage("loadMessages")
  async handleLoadMessages(
    client: Socket,
    payload: { room: string }
  ): Promise<void> {
    const { room } = payload;

    // Fetch messages for the room from the database or message store
    const messages = await this.chatService.getMessagesByRoom(room);

    // Emit the fetched messages back to the client
    client.emit("previousMessages", messages);
  }



}

