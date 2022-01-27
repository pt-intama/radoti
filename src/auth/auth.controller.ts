import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller({
  path: 'auth',
  version: '1.0',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('publicKey'))
  @Post('requestPrivateAccess')
  requestPermission(@Request() req: any) {
    return this.authService.createAccessToken(req.user);
  }

  @Get('claimCredentials')
  claimCredentials() {
    return this.authService.claimCredentials();
  }
}
