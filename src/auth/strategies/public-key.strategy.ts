import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-publickey';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PublicKeyStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(id: string, signature: string): Promise<any> {
    const verified = await lastValueFrom(
      this.authService.validateSignature(
        id,
        Buffer.from(signature, 'hex').toString('base64'),
      ),
    );
    if (!verified) {
      throw new UnauthorizedException();
    }
    return id;
  }
}
