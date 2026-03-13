import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
let io: Server;
export const initSocket = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });
  io.on('connection', (socket: Socket) => {
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.log(`✅ User ${userId} joined room`); // thêm dòng này
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
