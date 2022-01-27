import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configurationUtil } from './common/utils/configuration.util';
import { StorageModule } from './storage/storage.module';
import { PermissionModule } from './permission/permission.module';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurationUtil],
    }),
    StorageModule,
    PermissionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
