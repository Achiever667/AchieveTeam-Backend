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


function validateEnv() {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  
  if (isProduction) {
    required.push('DATABASE_URL', 'DIRECT_URL');
  }

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

validateEnv();

export const appConfig = {
  nodeEnv: currentNodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/loan_management_dev',
    directUrl: process.env.DIRECT_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as StringValue,
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as StringValue,
  },
  urls: {
    development: developmentUrl,
    production: productionUrl,
    current: isProduction ? productionUrl : developmentUrl,
    frontend: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },
  throttle: {
    ttl: 60_000,
    limit: 20,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  dataDirectory: join(process.cwd(), 'data'),
};
