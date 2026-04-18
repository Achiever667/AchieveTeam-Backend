import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles/roles.guard';
import { LoggerMiddleware } from './common/middleware/logger/logger.middleware';
import { appConfig } from './config/app.config';
import { LoansModule } from './loans/loans.module';
import { StaffModule } from './staff/staff.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: appConfig.throttle.ttl,
        limit: appConfig.throttle.limit,
      },
    ]),
    AuthModule,
    StaffModule,
    LoansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
