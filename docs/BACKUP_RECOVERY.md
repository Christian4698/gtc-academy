# Backup And Recovery

## Database Backup

Use Supabase managed backups in production. Also schedule manual SQL dumps before every production migration.

```powershell
supabase db dump --file backups/gtc-academy-$(Get-Date -Format yyyyMMdd-HHmm).sql
```

Keep backups outside the public repository.

## Storage Backup

Back up private buckets regularly:

- `course-videos`
- `course-resources`
- `profile-photos`
- `certificates`

Recommended production storage policy:

- course videos: private, signed URLs only
- paid resources: private, signed URLs only
- profile photos: owner plus admin access
- certificates: owner PDF access, public read only through verification metadata

## Restore Procedure

1. Freeze writes in the admin console.
2. Export current production state for safety.
3. Restore SQL dump to a staging project first.
4. Validate auth, profiles, purchases, certificates, exams and RLS.
5. Restore storage buckets.
6. Run mobile smoke tests against staging.
7. Promote to production only after validation.

## Environment Variable Protection

Never commit `.env`.

Client-safe variables may use `EXPO_PUBLIC_`.

Server-only secrets must stay in Supabase Edge Function secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `EMAIL_API_KEY`
- `ANTHROPIC_KEY`
- CDN provider tokens
- Mobile Money API secrets

## Disaster Recovery Preparation

- Keep separate staging and production Supabase projects.
- Test restore at least once per release cycle.
- Export storage bucket inventory monthly.
- Keep a manual list of active payment provider webhook URLs.
- Document the person responsible for approving certificate revocation and permanent user deletion.
