import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {Socket, Server} from "socket.io"
import { ChatService } from "./chat.service";

// @WebSocketGateway(3003, {cors: {origin: "*"}})
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect{
//     @WebSocketServer() server: Server
//     handleConnection(client: Socket) {
//         console.log("client connected", client.id)

//         client.broadcast.emit("user-joined", {
//             message: `New user joined the chat: ${client.id}`
//         })

//         this.server.emit("user-joined", {
//             message: `New user joined the chat: ${client.id}`
//         });
//     }

//     handleDisconnect(client: any) {
//         console.log("client disconnected", client.id)

//         this.server.emit("user-left", {
//             message: `user left the chat: ${client.id}`
//         });
//     }
//     // socket event for on connection
//  @SubscribeMessage("newMessage")
//  handleMessage(@MessageBody() message: string) {
// //   emit the message to all connected clients from socket emit 
//   this.server.emit("message", message) // broadcast the message to all connected clients
//  }
// }

@WebSocketGateway(3003, { cors: { origin: "*" } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly chatService: ChatService) {}

  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    console.log("client connected", client.id);
    client.emit("connected", { message: "You are connected to the server" });
  }

  handleDisconnect(client: Socket) {
    console.log("client disconnected", client.id);
  }

  @SubscribeMessage("joinRoom")
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);
    this.server.to(room).emit("user-joined", {
      message: `User ${client.id} joined the room.`,
    });
  }

  @SubscribeMessage("newMessage")
  handleMessage(client: Socket, payload: { room: string; message: string }) {
    const { room, message } = payload;
    //   // Save message to database
//   await this.chatService.saveMessage({ sender, receiver, room, content: message });
    console.log(`Message from ${client.id} to room ${room}: ${message}`);
    this.server.to(room).emit("message", { sender: client.id, message });
  }
}

// constructor(private readonly chatService: ChatService) {}

// @SubscribeMessage("newMessage")
// async handleMessage(
//   client: Socket,
//   payload: { room: string; sender: string; receiver: string; message: string }
// ) {
//   const { room, sender, receiver, message } = payload;

//   // Save message to database
//   await this.chatService.saveMessage({ sender, receiver, room, content: message });

//   // Emit message to the room
//   this.server.to(room).emit("message", { sender, message });
// }

