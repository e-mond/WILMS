# Communication Center UX Report (v1.6.1)

## Compose

- Guidance banner for channels and audience preview.
- Subject character counter (`n/120`).
- Body plain-text character count.
- Existing draft autosave in `RichTextEditor`, attachment uploader, schedule modes, and channel checkboxes retained.

## Campaigns

- New **Campaigns** section listing message history with audience, channels, recipients, delivery status label, and completion date.
- Reuses message list API; no new delivery business rules.

## Templates / delivery / failed

- Unchanged data contracts; still surface via executive `DataTable`.

## Non-goals

Audience resolution, quiet hours, and send/retry domain logic remain as shipped in v1.6.0.
