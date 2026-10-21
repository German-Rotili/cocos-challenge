import './shared/config/loadEnv'; // first: loads .env.<APP_ENV> before any module reads process.env
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './app.setup';
import { readConfig } from './shared/config/environment';

async function bootstrap() {
  const { port } = readConfig(); // fails fast on missing or invalid settings
  const app = configureApp(await NestFactory.create(AppModule));
  setupSwagger(app);
  await app.listen(port);
}
bootstrap();
