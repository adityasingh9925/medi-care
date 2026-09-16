import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';

export const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, _res: Response, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global Error Handler
app.use(errorHandler);