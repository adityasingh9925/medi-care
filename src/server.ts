import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { app } from './app.js';
import { prisma } from './config/db.js';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully via Prisma singleton');

    httpServer.listen(PORT, () => {
      console.log(`HTTP Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});