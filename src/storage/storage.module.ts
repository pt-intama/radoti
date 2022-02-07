import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { ENV_STORAGE_PATH } from 'src/common/constants';
import { join } from 'path';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storagePath = configService.get<string>(ENV_STORAGE_PATH);
        let dest = './storage';
        if (storagePath) {
          dest = storagePath;
        }

        const storage = diskStorage({
          destination: (_, file, cb) => {
            const uploadPath = join(dest, file.mimetype);
            if (!existsSync(uploadPath))
              mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
          },
        });

        return {
          dest,
          storage,
        };
      },
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService],
})
export class StorageModule {}
