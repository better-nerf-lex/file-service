import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      endpoint: this.configService.getOrThrow('AWS_S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_KEY'),
      },
      forcePathStyle: true, // Needed for LocalStack
    });
    this.bucketName = this.configService.getOrThrow('AWS_S3_BUCKET');
  }

  async uploadFile(file: Express.Multer.File) {
    const key = `${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      // In a real S3 scenario, the URL might be https://bucket.s3.region.amazonaws.com/key
      // For LocalStack/FileService, we want to return a URL that points to THIS service or the gateway?
      // The implementation plan says: "return { key, url, size, mimetype }".
      // The URL should point to this service's GET endpoint.
      const url = `/files/${key}`;
      return {
        key,
        url,
        size: file.size,
        mimetype: file.mimetype,
        originalName: file.originalname,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async getFileStream(key: string) {
    if (!key) {
      this.logger.warn('getFileStream called with undefined or empty key');
      throw new NotFoundException('File key is required');
    }
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      this.logger.log(`File found: ${key}`);
      return {
        stream: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        this.logger.warn(`File not found: ${key}`);
        throw new NotFoundException(`File not found: ${key}`);
      }
      this.logger.error(`Failed to get file ${key}: ${error.message}`);
      throw new InternalServerErrorException('Failed to get file');
    }
  }

  async deleteFile(key: string) {
    if (!key) {
      this.logger.warn('deleteFile called with undefined or empty key');
      throw new NotFoundException('File key is required');
    }
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async generatePresignedUrl(key: string) {
    // Useful if we want to bypass file-service for reading, but for now we stream through it.
    // Keeping it as an option or if requested.
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
