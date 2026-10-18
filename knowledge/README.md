# Knowledge Fixtures

This directory contains only non-sensitive development fixtures. Real legal
filings and conversation exports must not be committed here. Conversation and
template directories are ignored to prevent accidental additions.

`manifest.json` deliberately contains an empty `conversations` list. The gateway
supports generation without private conversation exports or PDF examples.
The schema seeds in gateway and infra also omit the removed PDF references.

The dev deployment syncs this directory to the private documents bucket under
`knowledge/` with `--delete`. Deploying this cleanup removes the deleted files
from that live prefix; it does not remove S3 object versions, backups, existing
database rows, old container images, or Git history.
