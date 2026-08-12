import { swaggerConfig, swaggerCustomOptions } from './config';
import { SwaggerModule } from '@nestjs/swagger';
import { appConfig } from './config';
import { configureNestApp } from './app.factory';

async function bootstrap() {
  const app = await configureNestApp();

  // Setup Swagger documentation
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);

  await app.listen(appConfig.port, () => {
    console.log(`🚀 Server running on http://localhost:${appConfig.port}`);
    console.log(`📚 Swagger documentation at http://localhost:${appConfig.port}/api/docs`);
  });
}

bootstrap();
