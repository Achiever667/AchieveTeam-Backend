import { appConfig } from './config/app.config';
import { configureNestApp } from './app.factory';

async function bootstrap() {
  const app = await configureNestApp();
  await app.listen(appConfig.port);
}
bootstrap();
