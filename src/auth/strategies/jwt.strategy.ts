import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from '../../config/app.config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtSecret,
      passReqToCallback: true,
    });
  }

  validate(request: { headers: { authorization?: string } }, payload: JwtPayload): AuthenticatedUser {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '').trim();

    if (token && this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
