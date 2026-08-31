"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`✅ User ${userId} joined room`);
        });
        socket.on('join_shop', (shopId) => {
            socket.join(`shop:${shopId}`);
            console.log(`✅ Joined shop room: shop:${shopId}`);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
};
exports.getIO = getIO;
