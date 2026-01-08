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
  CopyObjectCommand,
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

  async uploadFile(file: Express.Multer.File, providedKey?: string) {
    const key = providedKey || `${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      // In a real S3 scenario, the URL might be https://bucket.s3.region.amazonaws.com/key
      const url = `/files/${key}`;
      const s3Url = `s3://${this.bucketName}/${key}`;
      return {
        key,
        url,
        s3Url,
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

  async moveFile(sourceKey: string, destinationKey: string) {
    if (!sourceKey || !destinationKey) {
      this.logger.warn('moveFile called with undefined or empty keys');
      throw new NotFoundException('Source and destination keys are required');
    }

    const copyCommand = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
    });

    try {
      await this.s3Client.send(copyCommand);
      this.logger.log(`File copied from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        this.logger.warn(`Source file not found: ${sourceKey}`);
        throw new NotFoundException(`Source file not found: ${sourceKey}`);
      }
      this.logger.error(
        `Failed to copy file from ${sourceKey} to ${destinationKey}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to move file');
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: sourceKey,
    });

    try {
      await this.s3Client.send(deleteCommand);
      this.logger.log(`Source file deleted: ${sourceKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete source file ${sourceKey} after copy: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'File copied but failed to delete source',
      );
    }

    return {
      message: 'File moved successfully',
      sourceKey,
      destinationKey,
    };
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
