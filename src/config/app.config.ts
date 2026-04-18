import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { StringValue } from 'ms';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFilePath =
  nodeEnv === 'production' ? '.env.production' : '.env.development';

loadEnv({ path: join(process.cwd(), envFilePath) });

const currentNodeEnv = process.env.NODE_ENV ?? nodeEnv;
const isProduction = currentNodeEnv === 'production';
const developmentUrl = process.env.DEV_APP_URL ?? 'http://localhost:3000';
const productionUrl =
  process.env.PROD_APP_URL ?? 'https://your-project.vercel.app';

export const appConfig = {
  nodeEnv: currentNodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'loan-management-secret',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue,
  dataDirectory: join(process.cwd(), 'data'),
  urls: {
    development: developmentUrl,
    production: productionUrl,
    current: isProduction ? productionUrl : developmentUrl,
  },
  throttle: {
    ttl: 60_000,
    limit: 20,
  },
};
