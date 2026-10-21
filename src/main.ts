import './shared/config/loadEnv'; // first: loads .env.<APP_ENV> before any module reads process.env
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readConfig } from './shared/config/environment';

async function bootstrap() {
  const { port } = readConfig(); // fails fast on missing or invalid settings
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
}
bootstrap();
