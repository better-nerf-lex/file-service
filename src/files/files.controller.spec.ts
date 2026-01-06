import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

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
      const res = {
        set: jest.fn(),
      } as any;

      await controller.getFile(key, res);

      expect(filesService.getFileStream).toHaveBeenCalledWith(key);
    });

    it('should handle comma-separated path correctly', async () => {
      const key = 'test,path,file.pdf';
      const res = {
        set: jest.fn(),
      } as any;

      await controller.getFile(key, res);

      expect(filesService.getFileStream).toHaveBeenCalledWith(
        'test/path/file.pdf',
      );
    });

    it('should handle array path correctly', async () => {
      const key = ['case-001', 'pleadings', 'complaint_filing.pdf'] as any;
      const res = {
        set: jest.fn(),
      } as any;

      await controller.getFile(key, res);

      expect(filesService.getFileStream).toHaveBeenCalledWith(
        'case-001/pleadings/complaint_filing.pdf',
      );
    });
  });

  describe('deleteFile', () => {
    it('should call deleteFile with the correct key', async () => {
      const key = 'test/path/file.pdf';

      await controller.deleteFile(key);

      expect(filesService.deleteFile).toHaveBeenCalledWith(key);
    });

    it('should handle comma-separated path correctly', async () => {
      const key = 'test,path,file.pdf';

      await controller.deleteFile(key);

      expect(filesService.deleteFile).toHaveBeenCalledWith(
        'test/path/file.pdf',
      );
    });

    it('should handle array path correctly', async () => {
      const key = ['case-001', 'pleadings', 'complaint_filing.pdf'] as any;

      await controller.deleteFile(key);

      expect(filesService.deleteFile).toHaveBeenCalledWith(
        'case-001/pleadings/complaint_filing.pdf',
      );
    });
  });
});
