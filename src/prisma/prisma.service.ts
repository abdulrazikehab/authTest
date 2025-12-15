import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public prisma: any;

  constructor() {
    try {
      // Use @prisma/client instead of .prisma/client for better compatibility
      const { PrismaClient } = require('@prisma/client');
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });
      
      // Register Encryption Middleware
      try {
        const { EncryptionMiddleware } = require('./prisma-encryption.middleware');
        this.prisma.$use(EncryptionMiddleware);
        this.logger.log('Encryption Middleware registered');
      } catch (e) {
        this.logger.warn('Failed to register Encryption Middleware: ' + e);
      }

      this.logger.log('Auth PrismaClient created successfully');
    } catch (error) {
      this.logger.error('Failed to create Auth PrismaClient: ' + error);
      this.logger.error('Error details: ' + JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async onModuleInit() {
    try {
      // In serverless environments, connection pooling is handled differently
      // We'll let Prisma handle connections on-demand
      if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
        await this.prisma.$connect();
        this.logger.log('Auth Prisma connected to database');
      } else {
        // In Vercel/serverless, connections are managed automatically
        this.logger.log('Auth Prisma ready (serverless mode)');
      }
    } catch (error: any) {
      this.logger.error('Failed to connect to Auth database: ' + error?.message);
      this.logger.error('Database URL configured: ' + (process.env.DATABASE_URL ? 'Yes' : 'No'));
      // Don't throw in serverless - let it connect on first query
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log('Auth Prisma disconnected from database');
  }

  // Expose all Prisma models
  get user() {
    return this.prisma.user;
  }

  get tenant() {
    return this.prisma.tenant;
  }

   get customer() {
    return this.prisma.customer;
  }

  get refreshToken() {
    return this.prisma.refreshToken;
  }

  get passwordReset() {
    return this.prisma.passwordReset;
  }

  get loginAttempt() {
    return this.prisma.loginAttempt;
  }

  get staffPermission() {
    return this.prisma.staffPermission;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }

  get rateLimit() {
    return this.prisma.rateLimit;
  }

  get securityEvent() {
    return this.prisma.securityEvent;
  }
get merchantVerification() {
    return this.prisma.merchantVerification;
  }
  
  get merchantLimits() {
    return this.prisma.merchantLimits;
  }

  get userTenant() {
    return this.prisma.userTenant;
  }

  get session() {
    return this.prisma.session;
  }

  $transaction(p: any) {
    return this.prisma.$transaction(p);
  }
}