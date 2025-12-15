import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public prisma: any;

  constructor() {
    try {
      // Use @prisma/client instead of .prisma/client for better compatibility
      const { PrismaClient } = require('@prisma/client');
      
      // Configure Prisma for serverless with connection pooling
      const prismaOptions: any = {
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      };
      
      // Add connection pool configuration for serverless
      if (process.env.VERCEL || process.env.VERCEL_ENV) {
        prismaOptions.datasources = {
          db: {
            url: process.env.DATABASE_URL,
          },
        };
      }
      
      this.prisma = new PrismaClient(prismaOptions);
      
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
      const isServerless = process.env.VERCEL || process.env.VERCEL_ENV;
      
      // In serverless, don't connect eagerly - connections are created on-demand
      if (!isServerless && process.env.NODE_ENV !== 'production') {
        // Test connection with timeout
        await Promise.race([
          this.prisma.$connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]);
        this.logger.log('Auth Prisma connected to database');
      } else {
        // In Vercel/serverless, connections are managed automatically
        this.logger.log('Auth Prisma ready (serverless mode - connections will be created on-demand)');
      }
    } catch (error: any) {
      this.logger.error('Failed to connect to Auth database: ' + error?.message);
      this.logger.error('Database URL configured: ' + (process.env.DATABASE_URL ? 'Yes' : 'No'));
      const isServerless = process.env.VERCEL || process.env.VERCEL_ENV;
      // Don't throw in serverless - let it connect on first query
      if (!isServerless) {
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