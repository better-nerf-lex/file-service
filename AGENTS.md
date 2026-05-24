# File Service Agent Guide

## Scope

`file-service` is an internal NestJS 11 and TypeScript service that performs private document object operations using AWS SDK v3 against S3 in deployed environments and LocalStack-compatible configuration locally. It is called by `gateway`; it is not the business authorization boundary.

When this repository is opened inside the Lexai parent workspace, also follow `../devtools/docs/agents/WORKSPACE.md`, `../devtools/docs/agents/ARCHITECTURE.md`, and `../devtools/docs/agents/DELIVERY.md`.

## Current Layout

| Path | Responsibility |
| --- | --- |
| `src/files/files.controller.ts` | Internal HTTP upload, streaming download, delete, and move endpoints |
| `src/files/files.service.ts` | AWS S3 client setup and object operations |
| `src/app.module.ts` | Nest module/config wiring |
| `src/app.controller.ts` | Root/health behavior |
| `test` and `*.spec.ts` | Unit and HTTP integration tests |

## Service Boundaries

- `gateway` must authorize a user/domain action before requesting a file operation. Do not add business ownership decisions here without an explicit contract change.
- Despite being internal, treat every request as untrusted: validate object keys, upload metadata, file size/content rules, and malformed path handling.
- Keep S3 keys opaque and private. Never return credentials, log customer filenames/keys unnecessarily, or make objects publicly accessible as a shortcut.
- Coordinate endpoint or response-shape changes with `gateway/src/main/java/.../StorageFileService.java` and with `infra` if runtime configuration changes.

## NestJS And Storage Rules

- Keep controllers limited to HTTP parsing/validation/headers and put S3 actions in injectable services.
- Use explicit TypeScript return and input types for new or changed public methods. Do not add `any`; use AWS SDK configuration types and narrow caught `unknown` errors.
- Stream downloads rather than buffering document content. Set safe content response headers and prevent header injection from filenames.
- Treat move as a copy-then-delete operation with partial-failure behavior; do not report an atomic move unless it is actually guaranteed.
- Prefer ECS task-role credentials in production and local-only explicit credentials for LocalStack. Never add static AWS credentials to application code.
- Add validation and tests for path/key traversal-like input, missing objects, upload limits, storage failures, and any changed endpoint behavior.

## Configuration Contracts

Existing configuration includes `NODE_ENV`, `AWS_REGION`, `AWS_S3_ENDPOINT` for local development, `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` for local use, and `AWS_S3_BUCKET`. A rename or new required variable also requires an `infra` wiring review.

## Commands

Run from `file-service`:

```bash
npm test -- --runInBand
npm run build
npm run lint
```

The lint script writes fixes; review resulting diffs before treating it as verification.
