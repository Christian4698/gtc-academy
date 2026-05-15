# Offline And Sync Strategy

## Principle

Supabase is the source of truth. Local storage is only a cache and temporary sync queue.

## Current Phase 1 Implementation

Mobile service:

```text
src/services/offline.ts
```

Stores:

- cached profile essentials
- course metadata cache
- progress cache
- exam result cache
- sync queue items

The Phase 1 adapter uses Expo FileSystem JSON files because this project already includes `expo-file-system` through Expo. A future Phase 2 upgrade can swap the adapter to SQLite/Drift-equivalent storage without changing repository boundaries.

## Sync Rules

- Critical business records are never trusted from device only.
- Progress is cached locally, then synced when connection returns.
- Failed sync operations stay in queue with retry count.
- Conflict resolution favors Supabase for purchases, exams, certificates and roles.
- For progress, use the newest server-confirmed event and never reduce completed lessons.

## Future Phase 2

- Add network reachability listener.
- Add background sync on app resume.
- Add partial course download manager.
- Add resumable video/resource downloads.
- Add low-data mode rules for thumbnails, video quality and prefetching.
