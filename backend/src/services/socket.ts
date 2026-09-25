import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(); // Allow anonymous connection or authenticate later
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      (socket as any).user = decoded;
      socket.join(`user:${decoded.id}`);
      if (['SUPER_ADMIN', 'ADMIN', 'WARDEN'].includes(decoded.role)) {
        socket.join('admin-room');
        socket.join('emergency-room');
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`[Socket] Client connected: ${socket.id} (User: ${user?.id || 'guest'})`);

    socket.on('join-room', (room: string) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;

export const emitEmergencyAlert = (alertData: any) => {
  if (io) {
    console.log('[Socket] Broadcasting EMERGENCY ALERT to emergency-room & admin-room:', alertData.type);
    io.to('emergency-room').emit('emergency:alert', alertData);
    io.to('admin-room').emit('emergency:alert', alertData);
    io.emit('emergency:broadcast', alertData); // Also broadcast to entire namespace for high safety
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToAdmins = (event: string, data: any) => {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
};
