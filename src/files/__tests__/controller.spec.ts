import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from '../controller';
import { FilesService } from '../service';
import type { Response } from 'express';

describe('FilesController', () => {
  let controller: FilesController;
  let filesService: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            getFileStream: jest.fn().mockResolvedValue({
              stream: {},
              contentType: 'application/pdf',
              contentLength: 100,
            }),
            deleteFile: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    filesService = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFile', () => {
    it('should call getFileStream with the correct key', async () => {
      const key = 'test/path/file.pdf';
      const res: Response = {
        set: jest.fn(),
      } as Response;

      await controller.getFile(key, res);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(filesService.getFileStream as jest.Mock).toHaveBeenCalledWith(key);
    });

    it('should handle comma-separated path correctly', async () => {
      const key = 'test,path,file.pdf';
      const res: Response = {
        set: jest.fn(),
      } as Response;

      await controller.getFile(key, res);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(filesService.getFileStream as jest.Mock).toHaveBeenCalledWith(
        'test/path/file.pdf',
      );
    });

    it('should handle array path correctly', async () => {
      const key = ['case-001', 'pleadings', 'complaint_filing.pdf'];
      const res: Response = {
        set: jest.fn(),
      } as Response;

      await controller.getFile(key, res);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(filesService.getFileStream as jest.Mock).toHaveBeenCalledWith(
        'case-001/pleadings/complaint_filing.pdf',
      );
    });
  });

  describe('deleteFile', () => {
    it('should call deleteFile with the correct key', async () => {
      const key = 'test/path/file.pdf';

      await controller.deleteFile(key);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(filesService.deleteFile as jest.Mock).toHaveBeenCalledWith(key);
    });

    it('should handle comma-separated path correctly', async () => {
      const key = 'test,path,file.pdf';

      await controller.deleteFile(key);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(filesService.deleteFile as jest.Mock).toHaveBeenCalledWith(
        'test/path/file.pdf',
      );
    });

    it('should handle array path correctly', async () => {
      const key = ['case-001', 'pleadings', 'complaint_filing.pdf'];

      await controller.deleteFile(key);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(filesService.deleteFile as jest.Mock).toHaveBeenCalledWith(
        'case-001/pleadings/complaint_filing.pdf',
      );
    });
  });
});
