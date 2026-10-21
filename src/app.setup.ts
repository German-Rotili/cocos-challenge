import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  return app;
}

/** Serves the UI at /docs and the OpenAPI JSON at /docs-json. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Cocos Challenge — Trading API')
    .setDescription(
      'Search instruments, send and cancel orders, move cash and see a portfolio.',
    )
    .setVersion('0.0.1')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
