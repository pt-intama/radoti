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
import {
  ENV_SECURITY_RSA_AUTH_PATH,
  ENV_SECURITY_RSA_BITLENGTH,
  ENV_SECURITY_RSA_PASSPHRASE,
} from 'src/common/constants';
import { BitLength } from '@ryanbekhen/cryptkhen/lib/types';

@Injectable()
export class PermissionService {
  private logger: Logger = new Logger(PermissionService.name);
  private rsa: RSAEncryption;
  private passphrase: string;
  private bitLength: BitLength;
  constructor(private configService: ConfigService) {
    this.passphrase = this.configService.get(ENV_SECURITY_RSA_PASSPHRASE);
    this.bitLength = parseInt(
      this.configService.get(ENV_SECURITY_RSA_BITLENGTH),
    ) as BitLength;
    this.rsa = new RSAEncryption();
  }

  createPermissionKey(withCreateFile?: boolean) {
    const pemSource = from(
      this.rsa.generateKey({
        bitLength: this.bitLength,
        passphrase: this.passphrase,
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
          const directory = this.configService.get(ENV_SECURITY_RSA_AUTH_PATH);
          for (let i = 0; i < val.length; i++) {
            const path = join(directory, `${val[i].type}.pem`);
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
          this.rsa.signature(privateKey, identity, this.passphrase),
          'base64',
        );

        if (withCreateFile) {
          const directory = this.configService.get(ENV_SECURITY_RSA_AUTH_PATH);
          const path = join(directory, 'credentials');
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
      const directory = this.configService.get(ENV_SECURITY_RSA_AUTH_PATH);
      const path = join(directory, 'credentials-claim');
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
      const directory = this.configService.get(ENV_SECURITY_RSA_AUTH_PATH);
      const key = readFileSync(join(directory, 'publicKey.pem'));
      subscribe.next(key);
      subscribe.complete();
    });
  }
}
