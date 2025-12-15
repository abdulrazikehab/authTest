import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let cachedApp: any = null;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const logger = new Logger('Bootstrap');
  
  try {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    
    // Enable cookie parser
    app.use(cookieParser());
    
    // Verify JWT_SECRET is loaded before starting
    if (!process.env.JWT_SECRET) {
      logger.error('❌ JWT_SECRET is not configured in auth service environment variables');
      throw new Error('JWT_SECRET is not configured');
    }
    
    // Enable global validation
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Enable CORS with credentials for cookies
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // List of allowed origins
        const allowedOrigins = [
          'http://localhost:4173',
          'http://localhost:3000',
          'http://localhost:8080',
          'http://127.0.0.1:4173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:8080',
          process.env.FRONTEND_URL,
          'https://auth-test-tau-hazel.vercel.app',
        ].filter(Boolean);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Allow any subdomain of localhost (e.g., mystore.localhost:8080)
        if (origin.match(/^http:\/\/[\w-]+\.localhost(:\d+)?$/)) {
          return callback(null, true);
        }
        
        // Allow any subdomain of saa'ah.com
        if (origin.match(/^https?:\/\/[\w-]+\.saa'ah\.com$/)) {
          return callback(null, true);
        }
        
        // Allow local network IPs
        if (origin.match(/^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/)) {
          return callback(null, true);
        }
        
        // Allow Vercel preview deployments
        if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Tenant-Id', 'X-Tenant-Domain', 'X-Session-ID', 'X-Admin-API-Key'],
    });
    
    await app.init();
    cachedApp = expressApp;
    logger.log('✅ Auth service initialized for Vercel');
    return expressApp;
  } catch (error) {
    logger.error('Failed to initialize auth service:', error);
    throw error;
  }
}

export default async function handler(req: express.Request, res: express.Response) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

