import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { map, mergeMap, Subject } from 'rxjs';
import { ENV_SECURITY_RSA_AUTH_PATH } from './common/constants';
import { PermissionService } from './permission/permission.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger: Logger = new Logger(AppService.name);
  private subjectShutdownListener: Subject<void> = new Subject();

  constructor(
    private permissionService: PermissionService,
    private configService: ConfigService,
  ) {}

  onApplicationBootstrap() {
    const directory = this.configService.get(ENV_SECURITY_RSA_AUTH_PATH);
    if (!existsSync(join(directory, 'credentials'))) {
      this.permissionService
        .createPermissionKey(true)
        .pipe(map((pem) => pem.find((key) => key.type === 'privateKey')))
        .pipe(
          mergeMap((privateKey) =>
            this.permissionService.createSignature(privateKey.key, true),
          ),
        )
        .subscribe((data) => {
          writeFileSync(
            join(directory, 'credentials-claim'),
            JSON.stringify(data),
          );
          this.logger.log('first setup running, please start again');
          this.shutdown();
        });
    }
  }

  onShutdownListener(func: () => void) {
    this.subjectShutdownListener.subscribe(func);
  }

  shutdown() {
    this.subjectShutdownListener.next();
  }
}
