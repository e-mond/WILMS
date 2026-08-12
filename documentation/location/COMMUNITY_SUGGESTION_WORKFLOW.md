# Community Suggestion Workflow

**Product version:** 1.8.0  
**Language:** British English

## Rule

Registration officers must never insert communities directly into the master tables.

## Flow

```mermaid
sequenceDiagram
  actor Officer
  participant UI as RegistrationUI
  participant API as LocationsAPI
  participant DB as PendingSuggestions
  Officer->>UI: Search community
  UI->>API: GET /locations/search
  API-->>UI: No exact match
  Officer->>UI: Suggest new community
  UI->>API: POST /locations/community-suggestions
  API->>DB: Insert PENDING suggestion
  API-->>UI: Suggestion accepted
```

## Statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting review |
| `APPROVED` | Eligible to be promoted into `communities` by an admin import/review process |
| `REJECTED` | Not accepted |

## API

`POST /api/v1/locations/community-suggestions`

Body:

```json
{
  "districtId": "uuid",
  "proposedName": "New Community Name"
}
```
