# File Service

Internal NestJS service responsible for private document object operations. The gateway performs ownership checks before calling this service; this service validates requests and reads or writes S3 objects.

## Structure

```text
src/
  app/             Application wiring and health/root endpoint
  files/           Upload, download, delete, and move operations
    __tests__/     Unit tests
test/              HTTP integration tests
```

Files inside a feature directory use concise local names such as `controller.ts`, `service.ts`, and `module.ts`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP listener port |
| `NODE_ENV` | Runtime profile; production uses the ECS task role |
| `AWS_REGION` | S3 region |
| `AWS_S3_BUCKET` | Private documents bucket |
| `AWS_S3_ENDPOINT` | LocalStack endpoint for local development only |
| `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` | LocalStack credentials for local development only |

Production credentials are supplied by the ECS task role, not environment values committed in this repository. AWS deployment wiring belongs in `../infra`.

## Development

```bash
npm install
npm run start:dev
npm test -- --runInBand
npm run build
```

Local S3 emulation may be provided by the shared development environment; do not treat local credentials as deployment configuration.
