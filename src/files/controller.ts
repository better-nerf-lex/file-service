import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './service';
import type { Response } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 10MB limit, adjust as needed
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: { key?: string },
  ) {
    return this.filesService.uploadFile(file, body.key);
  }

  @Get('*path')
  async getFile(
    @Param('path') key: string | string[],
    @Res({ passthrough: true }) res: Response,
  ) {
    const fileKey = Array.isArray(key) ? key.join('/') : key.replace(/,/g, '/');
    const fileData = await this.filesService.getFileStream(fileKey);

    res.set({
      'Content-Type': fileData.contentType,
      'Content-Length': fileData.contentLength,
      'Content-Disposition': `inline; filename="${fileKey.split('/').pop()}"`,
    });

    return new StreamableFile(fileData.stream);
  }

  @Delete('*path')
  async deleteFile(@Param('path') key: string | string[]) {
    const fileKey = Array.isArray(key) ? key.join('/') : key.replace(/,/g, '/');
    await this.filesService.deleteFile(fileKey);
    return { message: 'File deleted successfully' };
  }

  @Post('move')
  async moveFile(@Body() body: { sourceKey: string; destinationKey: string }) {
    return this.filesService.moveFile(body.sourceKey, body.destinationKey);
  }
}
