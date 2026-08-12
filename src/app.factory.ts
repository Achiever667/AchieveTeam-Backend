import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import express, { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { appConfig } from './config/app.config';
import { PrismaService } from './database/prisma.service';

export async function configureNestApp(expressApp?: Express) {
  const adapter = expressApp ? new ExpressAdapter(expressApp) : undefined;
  const app = adapter
    ? await NestFactory.create(AppModule, adapter)
    : await NestFactory.create(AppModule);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Security: Helmet middleware
  app.use(helmet());

  // Request ID middleware
  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] as string || uuidv4();
    res.setHeader('x-request-id', req.id);
    next();
  });

  // CORS configuration
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    appConfig.urls.frontend,
    appConfig.urls.current,
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  await app.init();
  return app;
}

export function createExpressApp() {
  return express();
}

