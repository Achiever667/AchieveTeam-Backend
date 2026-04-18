import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = morgan('combined');

  use(req: Request, res: Response, next: NextFunction): void {
    this.logger(req, res, next);
  }
}
