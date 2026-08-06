# v1.6 Communication Release Notes

## Feature unit

`feature/v1.6-communication-notifications` — first Product Excellence unit after v1.5.1.

## Highlights

- Borrowers, groups, multi-group, and group leaders are first-class Communication Center audiences
- Audience preview + reusable segments
- SMS delivery uses phone numbers
- Payment due-today automation (distinct from due-soon)
- Collector reconciliation reminders + Super Admin failed-delivery / scheduler failure alerts
- Quiet hours on notification preferences
- Migration `0033_communication_audience_segments`

## Compatibility

Does not modify financial calculations, pool accounting, reconciliation integrity, or maker-checker controls.

## Ops

Apply migration `0033` on Neon before or with deploy. Existing Ghana location seed and recon expected backfill from v1.5.1 remain in place.
