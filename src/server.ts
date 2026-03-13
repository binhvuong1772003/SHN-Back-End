import '@/config/env';
import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app';
import { initSocket } from './socket';

dotenv.config();
process.env.TZ = 'Asia/Ho_Chi_Minh';
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
