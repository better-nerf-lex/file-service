# File Service - S3 Configuration

## Overview

The file-service manages document uploads/downloads using AWS S3. It uses different configurations for development (LocalStack) and production (AWS S3 with IAM).

## Environment Variables

### Development (.env)
```env
NODE_ENV=development
AWS_REGION=us-east-1
AWS_S3_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY=test
AWS_SECRET_KEY=test
AWS_S3_BUCKET=lexai-documents
```

### Production (ECS Task Definition)
```env
NODE_ENV=production
PORT=8080
AWS_REGION=eu-north-1
AWS_S3_BUCKET=dev-paragrafic-documents
```

**No AWS credentials needed in production!** - ECS task uses IAM task role.

## S3 Configuration Logic

```typescript
const isProduction = NODE_ENV === 'production';

if (isProduction) {
  // Use IAM task role (credentials automatically provided by ECS)
  new S3Client({ region: 'eu-north-1' });
} else {
  // Use explicit credentials for LocalStack
  new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    forcePathStyle: true
  });
}
```

## Terraform Resources

### S3 Bucket (infra/envs/dev/s3-documents.tf)
- **Name:** `dev-paragrafic-documents`
- **Versioning:** Enabled
- **Encryption:** AES256
- **Public Access:** Blocked

### IAM Policy (infra/envs/dev/iam-file-service.tf)
Attached to ECS task role:
- `s3:PutObject` - Upload files
- `s3:GetObject` - Download files
- `s3:DeleteObject` - Delete files
- `s3:ListBucket` - List bucket contents

## Deployment Flow

1. **Terraform creates:**
   - S3 bucket for documents
   - IAM role for file-service ECS task
   - IAM policy allowing S3 access

2. **ECS starts task:**
   - Assumes IAM task role
   - AWS SDK automatically uses task role credentials

3. **File-service reads env vars:**
   - `NODE_ENV=production` → Use IAM role
   - `AWS_S3_BUCKET=dev-paragrafic-documents` → Target bucket

4. **S3 operations:**
   - File uploads go to S3 bucket
   - Downloads served from S3
   - All authenticated via IAM task role

## Testing

### Local (with LocalStack)
```bash
cd file-service
npm install
npm run start:dev
```

### Production (ECS)
After deploying to ECS, test upload:
```bash
curl -X POST https://test-0.paragrafic.pl/api/files/upload \
  -F "file=@test.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Check S3 bucket:
```bash
aws s3 ls s3://dev-paragrafic-documents/
```

## Troubleshooting

### S3 Access Denied
Check IAM role has correct permissions:
```bash
aws ecs describe-task-definition --task-definition dev-file-service \
  --query 'taskDefinition.taskRoleArn'

aws iam list-attached-role-policies --role-name dev-file-service-task-role
```

### Wrong Bucket
Verify environment variable:
```bash
aws ecs describe-tasks \
  --cluster dev-cluster \
  --tasks $(aws ecs list-tasks --cluster dev-cluster --service-name dev-file-service --query 'taskArns[0]' --output text) \
  --query 'tasks[0].overrides.containerOverrides[0].environment'
```
