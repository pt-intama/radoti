import { Injectable } from '@nestjs/common';
import { parse } from 'path';
import { from, map, mergeMap } from 'rxjs';
import { PrismaService } from 'src/prisma.service';
import { ReadAllFileDto } from './dto';

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
          isPublic,
        },
      }),
    );

    return source;
  }

  readAllFile(readAllFileDto: ReadAllFileDto, isPublic?: boolean) {
    const page =
      readAllFileDto.page - 1 < 0
        ? 0
        : (readAllFileDto.page - 1) * readAllFileDto.itemPerPage;
    const itemPerPage = readAllFileDto.itemPerPage;
    const sourceCountItem = from(
      this.prisma.storage.count({
        where: {
          isPublic,
        },
      }),
    );
    const source = from(
      this.prisma.storage.findMany({
        skip: page,
        take: itemPerPage,
        where: {
          isPublic,
        },
        orderBy: {
          updatedAt: 'asc',
        },
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
    return source.pipe(
      mergeMap((files) =>
        sourceCountItem.pipe(
          map((count) => ({
            totalPage: Math.round(count / itemPerPage),
            files,
          })),
        ),
      ),
    );
  }

  rename(id: string, name: string) {
    const source = from(
      this.prisma.storage.update({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
        data: {
          name,
        },
      }),
    );
    return source;
  }

  remove(id: string) {
    const source = from(
      this.prisma.storage.delete({
        where: {
          id,
        },
      }),
    );
    return source;
  }
}
