# Private Knowledge Base

This folder is deployed by the file-service dev workflow into the private documents bucket under:

```text
s3://dev-paragrafic-documents/knowledge/
```

It is not served by CloudFront or the frontend bucket. Gateway can read these objects through file-service using the same private path it already uses for context and template files.

## Structure

- `manifest.json` maps stable IDs and tags to individual conversation files.
- `conversations/*.txt` contains one exported conversation per file.
- `templates/document-examples/**` contains private template examples used by gateway seed data.
- `samples/**` contains private sample files for local/dev verification.

Conversation filenames should be the slugified ChatGPT title summary:

```text
Odpowiedź na pozew -> odpowiedz-na-pozew.txt
Wniosek o odroczenie kary -> wniosek-o-odroczenie-kary.txt
```

Gateway selects conversations by matching the requested document title, prompt, answers, requirements, manifest `id`,
`title`, `documentTypes`, and `tags`.

## Manifest Entry

```json
{
  "id": "divorce-with-children",
  "title": "Divorce With Children",
  "description": "Useful prompt flow and final draft for divorce documents involving children.",
  "language": "pl",
  "documentTypes": ["divorce"],
  "tags": ["family-law", "children", "alimony"],
  "path": "conversations/divorce-with-children.txt"
}
```

The full S3 key for that file will be:

```text
knowledge/conversations/divorce-with-children.txt
```

Keep real conversations out of logs and public buckets. Treat files here as confidential source material.
