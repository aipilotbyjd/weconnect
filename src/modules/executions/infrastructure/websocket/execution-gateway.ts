import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/executions',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class ExecutionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ExecutionGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> socketIds
  private readonly executionSubscriptions = new Map<string, Set<string>>(); // executionId -> socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`User ${userId} connected via socket ${client.id}`);
    } catch (error) {
      this.logger.error(`Authentication failed for socket ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Remove from execution subscriptions
    for (const [executionId, socketIds] of this.executionSubscriptions.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.executionSubscriptions.delete(executionId);
      }
    }

    this.logger.log(`Socket ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe-execution')
  handleSubscribeExecution(client: Socket, executionId: string) {
    if (!this.executionSubscriptions.has(executionId)) {
      this.executionSubscriptions.set(executionId, new Set());
    }
    this.executionSubscriptions.get(executionId)!.add(client.id);
    
    client.join(`execution:${executionId}`);
    this.logger.log(`Socket ${client.id} subscribed to execution ${executionId}`);
  }

  @SubscribeMessage('unsubscribe-execution')
  handleUnsubscribeExecution(client: Socket, executionId: string) {
    this.executionSubscriptions.get(executionId)?.delete(client.id);
    client.leave(`execution:${executionId}`);
    this.logger.log(`Socket ${client.id} unsubscribed from execution ${executionId}`);
  }

  // Broadcast execution updates
  broadcastExecutionUpdate(executionId: string, update: any) {
    this.server.to(`execution:${executionId}`).emit('execution-update', {
      executionId,
      ...update,
    });
  }

  // Broadcast execution logs
  broadcastExecutionLog(executionId: string, log: any) {
    this.server.to(`execution:${executionId}`).emit('execution-log', {
      executionId,
      log,
    });
  }

  // Broadcast to specific user
  broadcastToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}