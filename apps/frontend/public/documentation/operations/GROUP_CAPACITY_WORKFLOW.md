# Group capacity workflow — Approver application review

```mermaid
sequenceDiagram
  participant Approver
  participant Review as Application Review
  participant API as Groups API
  participant Settings as System settings

  Approver->>Review: Select group
  Review->>API: list groups (memberCount, maxGroupSize, isFull)
  API->>Settings: getGroupSizeLimits()
  Approver->>API: addMember
  alt group full
    API-->>Review: 422 named capacity message
    Review-->>Approver: Warning + Create New Group
  else capacity remaining
    API-->>Review: member added (staff in-app only if pending)
  end
  Approver->>API: createGroup (community pre-filled, collector required)
  API-->>Review: new group + borrower assigned
```

## Rules

- Full groups are disabled in the select list.
- Create New Group is always available during pending review.
- Community is taken from the application.
- Collector remains required (existing group rule).
- Borrower SMS is **not** sent on assignment while status is PENDING.
