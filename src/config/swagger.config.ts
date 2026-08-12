import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Loan Management API')
  .setDescription(
    'Production-ready loan management backend with PostgreSQL, Prisma, JWT auth, and role-based access control',
  )
  .setVersion('1.0.0')
  .setContact('Support', '', 'support@example.com')
  .setLicense('UNLICENSED', '')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT access token',
    },
    'access-token',
  )
  .addServer('http://localhost:3000', 'Development')
  .addServer('https://achieve-team-backend.vercel.app', 'Production')
  .addTag('Auth', 'Authentication and authorization endpoints')
  .addTag('Users', 'User management endpoints')
  .addTag('Loans', 'Loan management endpoints')
  .addTag('Repayments', 'Repayment management endpoints')
  .addTag('Transactions', 'Transaction tracking endpoints')
  .addTag('Notifications', 'Notification management endpoints')
  .addTag('Health', 'System health check endpoints')
  .build();

export const swaggerConfig = config;

export const swaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
};
