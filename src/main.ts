import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { ENV_SERVER_MODE, ENV_SERVER_PORT } from './common/constants';
import helmet from 'helmet';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger: Logger = new Logger('ApplicationBootstrap');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // helmet
  const serverMode = app.get(ConfigService).get(ENV_SERVER_MODE);
  if (serverMode === 'production') app.use(helmet());

  // compression
  app.use(compression());

  // validation
  app.useGlobalPipes(new ValidationPipe());

  // shutdown hook and listener
  app.enableShutdownHooks();
  app.get(AppService).onShutdownListener(() => app.close());

  // listen in port 3000
  const port = app.get(ConfigService).get(ENV_SERVER_PORT);
  await app.listen(port ? port : 3000, () =>
    logger.log(`Running on port ${port}`),
  );
}
bootstrap();
