import { Module } from '@nestjs/common';
import { FilesController } from './controller';
import { FilesService } from './service';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
