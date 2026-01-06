import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';
import { Logger, NotFoundException } from '@nestjs/common';

describe('FilesService', () => {
  let service: FilesService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const config = {
                AWS_REGION: 'us-east-1',
                AWS_S3_ENDPOINT: 'http://localhost:4566',
                AWS_ACCESS_KEY: 'test',
                AWS_SECRET_KEY: 'test',
                AWS_S3_BUCKET: 'test-bucket',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFileStream', () => {
    it('should log when file is found', async () => {
      const loggerLogSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();
      const s3SendSpy = jest
        .spyOn((service as any).s3Client, 'send')
        .mockResolvedValue({
          Body: {},
          ContentType: 'image/png',
          ContentLength: 100,
        });

      await service.getFileStream('test-key');

      expect(loggerLogSpy).toHaveBeenCalledWith('File found: test-key');

      loggerLogSpy.mockRestore();
      s3SendSpy.mockRestore();
    });

    it('should log warning when file is not found', async () => {
      const loggerWarnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation();
      const s3SendSpy = jest
        .spyOn((service as any).s3Client, 'send')
        .mockRejectedValue({
          name: 'NoSuchKey',
        });

      await expect(service.getFileStream('non-existent')).rejects.toThrow();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'File not found: non-existent',
      );

      loggerWarnSpy.mockRestore();
      s3SendSpy.mockRestore();
    });

    it('should log warning and throw NotFoundException if key is missing', async () => {
      const loggerWarnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation();

      try {
        await service.getFileStream('');
        fail('Should have thrown NotFoundException');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'getFileStream called with undefined or empty key',
      );

      loggerWarnSpy.mockRestore();
    });
  });

  describe('deleteFile', () => {
    it('should log warning and throw NotFoundException if key is missing', async () => {
      const loggerWarnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation();

      try {
        await service.deleteFile('');
        fail('Should have thrown NotFoundException');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'deleteFile called with undefined or empty key',
      );

      loggerWarnSpy.mockRestore();
    });
  });
});
