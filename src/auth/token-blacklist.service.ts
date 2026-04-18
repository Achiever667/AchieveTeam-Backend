import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly tokens = new Set<string>();

  blacklist(token: string): void {
    this.tokens.add(token);
  }

  isBlacklisted(token: string): boolean {
    return this.tokens.has(token);
  }
}
