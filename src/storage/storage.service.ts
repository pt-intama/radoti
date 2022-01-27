import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'path';
import { from, map } from 'rxjs';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}
  save(file: Express.Multer.File, isPublic?: boolean) {
    const id = file.filename;
    const name = parse(file.originalname).name;
    const type = file.mimetype;
    const size = file.size;
    const path = file.destination;
    const source = from(
      this.prisma.storage.create({
        data: {
          id,
          name,
          type,
          size,
          path,
          isPublic,
        },
      }),
    );
    return source.pipe(
      map((val) => ({
        id: val.id,
        size: val.size,
        isPublic: val.isPublic,
      })),
    );
  }

  readFileById(id: string, isPublic?: boolean) {
    const source = from(
      this.prisma.storage.findFirst({
        where: {
          id,
          isPublic: isPublic ? isPublic : false,
        },
      }),
    );

    return source;
  }

  rename(id: string, name: string) {
    const source = from(
      this.prisma.storage.update({
        where: {
          id,
        },
        data: {
          name,
        },
      }),
    );
    return source;
  }
}
