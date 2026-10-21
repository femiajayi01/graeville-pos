// Set the process timezone before anything creates a Date, so "today" means the shop's today.
process.env.TZ = process.env.APP_TIMEZONE || 'Africa/Lagos';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('corsOrigins'),
    credentials: true,
  });
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const appName = config.get<string>('appName') ?? 'Graeville POS';
  const swagger = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription(`${appName} point-of-sale backend`)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger),
    { customSiteTitle: `${appName} API` },
  );

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  Logger.log(
    `API running on http://localhost:${port}/api  (docs: http://localhost:${port}/api/docs)`,
    'Bootstrap',
  );
}
void bootstrap();
