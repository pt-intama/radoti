import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, map, mergeMap, tap } from 'rxjs';
import { PermissionService } from 'src/permission/permission.service';

@Injectable()
export class AuthService {
  constructor(
    private permissionService: PermissionService,
    private jwtService: JwtService,
  ) {}

  createAccessToken(id: string) {
    const payload = { id };
    const jwtSource = from(this.jwtService.signAsync(payload)).pipe(
      map((value) => ({
        accessToken: value,
      })),
    );
    return jwtSource;
  }

  validateSignature(id: string, signature: string) {
    return this.permissionService
      .getVerificationKey()
      .pipe(map((buffer) => buffer.toString('utf-8')))
      .pipe(
        mergeMap((key) =>
          this.permissionService.isVerifiedSignature(id, key, signature),
        ),
      );
  }

  claimCredentials() {
    return this.permissionService.claimCredentials().pipe(
      tap((val) => {
        if (!val) throw new ForbiddenException();
      }),
    );
  }
}
