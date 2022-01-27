import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RSAEncryption } from '@ryanbekhen/cryptkhen';
import { randomUUID } from 'crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import * as moment from 'moment';
import { join, parse } from 'path';
import { from, map, Observable, tap } from 'rxjs';
import { isPathAvailable } from 'src/common/utils';
import { ENV_SECURITY_SECRET } from 'src/common/constants';

@Injectable()
export class PermissionService {
  private logger: Logger = new Logger(PermissionService.name);
  private rsa: RSAEncryption;
  private secret: string;
  constructor(private configService: ConfigService) {
    this.secret = this.configService.get<string>(ENV_SECURITY_SECRET);
    this.rsa = new RSAEncryption();
  }

  createPermissionKey(withCreateFile?: boolean) {
    const pemSource = from(
      this.rsa.generateKey({
        bitLength: 2048,
        passphrase: this.secret,
      }),
    ).pipe(
      map((value) => {
        const objectKey = Object.keys(value);
        const newObject: { type: string; key: string }[] = [];
        for (let i = 0; i < objectKey.length; i++) {
          newObject.push({
            type: objectKey[i],
            key: value[objectKey[i]],
          });
        }
        return newObject;
      }),
      tap((val) => {
        if (withCreateFile) {
          for (let i = 0; i < val.length; i++) {
            const path = join(process.cwd(), 'keys', `${val[i].type}.pem`);
            if (!isPathAvailable(path, true)) {
              this.logger.log(`Permission ${val[i].type} has been generated`);
            } else {
              const newDirectory = join(
                process.cwd(),
                'keys',
                moment().format('YYYYMMDD'),
              );
              mkdirSync(newDirectory, {
                recursive: true,
              });
              copyFileSync(join(path), join(newDirectory, parse(path).base));
              this.logger.log(`Permission ${val[i].type} has been generated`);
            }
            writeFileSync(path, val[i].key);
          }
        }
      }),
    );

    return pemSource;
  }

  createSignature(privateKey: string, withCreateFile?: boolean) {
    return new Observable<{ identity: string; signature: string }>(
      (subsribe) => {
        const identity = Buffer.from(randomUUID()).toString('hex');
        const signature = Buffer.from(
          this.rsa.signature(privateKey, identity, this.secret),
          'base64',
        );

        if (withCreateFile) {
          const path = join(process.cwd(), 'keys', 'credentials');
          if (!existsSync(path)) {
            mkdirSync(parse(path).dir, { recursive: true });
          }
          writeFileSync(path, identity);
        }

        subsribe.next({
          identity,
          signature: signature.toString('hex'),
        });
        subsribe.complete();
      },
    );
  }

  isVerifiedSignature(id: string, publicKey: string, signature: string) {
    return new Observable<boolean>((subscribe) => {
      const verified = this.rsa.isVerified(publicKey, signature, id);
      subscribe.next(verified);
      subscribe.complete();
    });
  }

  claimCredentials() {
    return new Observable<{
      identity: string;
      signature: string;
    }>((subscribe) => {
      const path = join(process.cwd(), 'keys', 'credentials-claim');
      if (existsSync(path)) {
        const credentials = readFileSync(path, 'utf-8');
        unlinkSync(path);
        subscribe.next(JSON.parse(credentials));
      } else {
        subscribe.next();
      }
      subscribe.complete();
    });
  }

  getVerificationKey() {
    return new Observable<Buffer>((subscribe) => {
      const key = readFileSync(join(process.cwd(), 'keys', 'publicKey.pem'));
      subscribe.next(key);
      subscribe.complete();
    });
  }
}
