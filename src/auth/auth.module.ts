import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { readFileSync } from 'fs';
import { join } from 'path/posix';
import { ENV_SECURITY_EXPIRE, ENV_SECURITY_SECRET } from 'src/common/constants';
import { PermissionModule } from 'src/permission/permission.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PublicKeyStrategy } from './strategies/public-key.strategy';

@Module({
  imports: [
    PermissionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        let privateKey: Buffer = Buffer.from('');
        try {
          privateKey = readFileSync(
            join(process.cwd(), 'keys', 'privateKey.pem'),
          );
        } catch {}
        return {
          privateKey: {
            key: privateKey,
            passphrase: configService.get<string>(ENV_SECURITY_SECRET),
          },
          signOptions: {
            expiresIn: configService.get<string>(ENV_SECURITY_EXPIRE),
            issuer: 'shared-socket-service',
            algorithm: 'RS256',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PublicKeyStrategy, JwtStrategy],
})
export class AuthModule {}
