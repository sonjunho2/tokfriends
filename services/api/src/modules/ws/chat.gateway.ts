import { WebSocketGateway, WebSocketServer, OnGatewayConnection, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { containsBadWord } from '../../common/badwords';
import { logEvent } from '../analytics/analytics.service';

const prisma = new PrismaClient();

@WebSocketGateway({ cors: { origin: process.env.WS_ALLOWED_ORIGINS || '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth && client.handshake.auth.token) || (client.handshake.query && (client.handshake.query['token'] as string));
      if (!token) { client.disconnect(true); return; }
      const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'dev');
      (client as any).userId = payload.sub;
      client.emit('connected', { ok: true, userId: payload.sub });
    } catch (e) {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    const userId = (client as any).userId as string;
    const chat = await prisma.chat.findUnique({ where: { id: data.chatId } });
    if (!chat) return { ok: false, error: 'NO_CHAT' };
    if (![chat.userAId, chat.userBId].includes(userId)) return { ok: false, error: 'NOT_MEMBER' };
    client.join(`chat:${data.chatId}`);
    return { ok: true };
  }

  @SubscribeMessage('typing')
  async typing(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string, typing: boolean }) {
    const userId = (client as any).userId as string;
    this.server.to(`chat:${data.chatId}`).emit('typing', { chatId: data.chatId, userId, typing: data.typing });
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async messageSend(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string, content: string }) {
    const userId = (client as any).userId as string;
    if (containsBadWord(data.content)) return { ok: false, error: 'CONTENT_FLAGGED' };
    const chat = await prisma.chat.findUnique({ where: { id: data.chatId } });
    if (!chat) return { ok: false, error: 'NO_CHAT' };
    if (![chat.userAId, chat.userBId].includes(userId)) return { ok: false, error: 'NOT_MEMBER' };
    const msg = await prisma.message.create({ data: { chatId: data.chatId, senderId: userId, content: data.content } });
    await prisma.chat.update({ where: { id: data.chatId }, data: { lastMessageAt: new Date() } });
    this.server.to(`chat:${data.chatId}`).emit('message:new', { chatId: data.chatId, msg });
    await logEvent('message_sent_ws', { chatId: data.chatId }, userId);
    return { ok: true };
  }
}
