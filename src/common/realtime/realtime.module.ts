import { Global, Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { PrismaService } from '../../database/prisma.service';

@Global()
@Module({
  providers: [RealtimeService, PrismaService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
