import type { Request, Response } from 'express';
import { createExpressApp, configureNestApp } from '../src/app.factory';

const expressApp = createExpressApp();
let isBootstrapped = false;

async function bootstrap() {
  if (!isBootstrapped) {
    await configureNestApp(expressApp);
    isBootstrapped = true;
  }

  return expressApp;
}

export default async function handler(
  req: Request,
  res: Response,
) {
  const app = await bootstrap();
  return app(req, res);
}
