import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ENV_SECURITY_RSA_AUTH_PATH } from 'src/common/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    let publicKey = Buffer.from('');
    const configService: ConfigService = new ConfigService();
    const directory = configService.get(ENV_SECURITY_RSA_AUTH_PATH);
    try {
      publicKey = readFileSync(join(directory, 'publicKey.pem'));
    } catch {}
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return { id: payload.id };
  }
}
