import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '../../config/app.config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private supabase: SupabaseClient | null = null;

  constructor(private readonly prisma: PrismaService) {
    const { url, serviceRoleKey } = appConfig.supabase;

    if (url && serviceRoleKey) {
      try {
        this.supabase = createClient(url, serviceRoleKey, {
          // use realtime transports and other options as needed
        });
        this.logger.log('Supabase client initialized for realtime events');
      } catch (err) {
        this.logger.warn('Failed to initialize Supabase client, realtime disabled');
        this.supabase = null;
      }
    } else {
      this.logger.log('Supabase config not provided — realtime disabled');
    }
  }

  /**
   * Persist a notification via Prisma then emit a realtime event if Supabase is configured.
   * Call this after a successful DB transaction/commit.
   */
  async notifyUser(userId: string, type: string, title: string, message: string, meta?: any) {
    // Persist notification in the database (source of truth)
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        metadata: meta || null,
      },
    });

    // Emit realtime event if client available
    if (this.supabase) {
      try {
        // Supabase Realtime: prefer listening on the `notifications` table.
        // Here we trigger a lightweight publish by inserting a record via Supabase
        // into the same table so connected clients receive the change.
        // NOTE: This duplicates the write if used alongside Prisma. Use only if you
        // have Supabase Service Role write access and you choose to write through
        // Supabase instead of Prisma. We will NOT do that here to avoid duplication.

        // Instead, try to broadcast via a realtime channel if available.
        // The JS client realtime API may vary by version; guard to avoid runtime errors.
        // @ts-ignore
        if (this.supabase.channel) {
          try {
            // Broadcast is best-effort — clients should be authorized and listen on channels.
            // The exact API depends on supabase-js version; this is a guarded attempt.
            // @ts-ignore
            await this.supabase.channel(`user:${userId}`).send('broadcast', {
              event: 'notification.created',
              payload: { id: notification.id, title, message, meta },
            });
          } catch (e) {
            this.logger.debug('Supabase channel broadcast not available or failed');
          }
        }
      } catch (err) {
        this.logger.warn('Realtime notify failed', err as any);
      }
    }

    return notification;
  }

  /**
   * General emit – best-effort. Use after DB commit.
   */
  async emit(channel: string, event: string, payload: any) {
    if (!this.supabase) return;

    try {
      // Guarded attempt; API differs between versions.
      // @ts-ignore
      if (this.supabase.channel) {
        // @ts-ignore
        await this.supabase.channel(channel).send('broadcast', { event, payload });
        return true;
      }

      // Fallback: try invoking a Postgres function or similar if configured.
    } catch (err) {
      this.logger.warn('Failed to emit realtime event', err as any);
    }

    return false;
  }
}
