import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { ENV_PORT } from './common/constants';
import helmet from 'helmet';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // helmet
  app.use(helmet());

  // compression
  app.use(compression());

  // validation
  app.useGlobalPipes(new ValidationPipe());

  // shutdown hook and listener
  app.enableShutdownHooks();
  app.get(AppService).onShutdownListener(() => app.close());

  // listen in port 3000
  const port = app.get(ConfigService).get<string>(ENV_PORT);
  await app.listen(port ? port : 3000);
}
bootstrap();
