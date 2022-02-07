import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { join } from 'path/posix';
import { catchError, map, Observable, throwError } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ReadAllFileDto, UploadFileDto, UploadFileResponseDto } from './dto';
import { StorageService } from './storage.service';
import { extension } from 'mime-types';
import { ConfigService } from '@nestjs/config';
import { ENV_STORAGE_PATH } from 'src/common/constants';

@Controller({
  path: 'storage',
  version: '1.0',
})
export class StorageController {
  constructor(
    private configService: ConfigService,
    private storageService: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Headers() uploadFileDto: UploadFileDto,
  ): Observable<UploadFileResponseDto> {
    if (!file) throw new BadRequestException();
    let isPublic: boolean;
    if (uploadFileDto.mode === 'public') {
      isPublic = true;
    } else {
      isPublic = false;
    }
    return this.storageService.save(file, isPublic).pipe(
      map((val) => ({
        id: val.id,
        isPublic: val.isPublic,
      })),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('file/rename/:id')
  renameFile(@Param('id') id: string, @Body('name') name: string) {
    if (!id || !name) throw new BadRequestException();
    return this.storageService
      .rename(id, name)
      .pipe(catchError(() => throwError(() => new BadRequestException())));
  }

  @Get('browser')
  getBrowsePublic(@Query() readAllFileDto: ReadAllFileDto) {
    if (isNaN(+readAllFileDto.page) || isNaN(+readAllFileDto.itemPerPage)) {
      throw new BadRequestException();
    }
    return this.storageService.readAllFile(
      {
        page: +readAllFileDto.page,
        itemPerPage: +readAllFileDto.itemPerPage,
      },
      true,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('browser/private')
  getBrowsePrivate(@Query() readAllFileDto: ReadAllFileDto) {
    if (isNaN(+readAllFileDto.page) || isNaN(+readAllFileDto.itemPerPage)) {
      throw new BadRequestException();
    }
    return this.storageService.readAllFile({
      page: +readAllFileDto.page,
      itemPerPage: +readAllFileDto.itemPerPage,
    });
  }

  @Get('file/:id')
  getFilePublic(@Res({ passthrough: true }) res: any, @Param('id') id: string) {
    const source = this.storageService.readFileById(id, true).pipe(
      map((file) => {
        if (!file) {
          throw new NotFoundException();
        }

        const fileStream = createReadStream(
          join(process.cwd(), file.path, file.id),
        );

        res.set({
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${
            file.name
          }.${extension(file.type)}"`,
        });
        return new StreamableFile(fileStream);
      }),
    );
    return source;
  }

  @UseGuards(JwtAuthGuard)
  @Get('file/private/:id')
  getFilePrivate(
    @Res({ passthrough: true }) res: any,
    @Param('id') id: string,
  ) {
    const source = this.storageService.readFileById(id).pipe(
      map((file) => {
        if (!file) {
          throw new NotFoundException();
        }

        const fileStream = createReadStream(
          join(process.cwd(), file.path, file.id),
        );

        res.set({
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${file.name}"`,
        });
        return new StreamableFile(fileStream);
      }),
    );
    return source;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('file/:id')
  removeFile(@Param('id') id: string) {
    return this.storageService.remove(id).pipe(
      map((file) => {
        if (!file) {
          throw new NotFoundException();
        }

        const storagePath = this.configService.get<string>(ENV_STORAGE_PATH);
        let dest = './storage';
        if (storagePath) {
          dest = storagePath;
        }

        const path = join(dest, file.type, file.id);

        if (existsSync(path)) {
          unlinkSync(path);
        }

        return file;
      }),
      catchError(() => throwError(() => new NotFoundException())),
    );
  }
}
