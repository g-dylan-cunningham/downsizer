# Deployment Guide

## Vercel Deployment

### Required Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

#### Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

#### Database (Required)
```
DATABASE_URL=postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.xxx:password@xxx.supabase.com:5432/postgres
```

**Important**:
- These variables MUST be set for ALL environments (Production, Preview, Development)
- Without these, the build will fail with "Missing Supabase environment variables"
- Get these values from your Supabase project settings

### Build Configuration

Vercel should auto-detect Next.js settings. No additional configuration needed.

### Post-Deployment Steps

1. **Run Prisma migrations**:
   After first deployment, you may need to run migrations manually if they haven't been applied:
   ```bash
   npx prisma migrate deploy
   ```

2. **Create Supabase Storage bucket**:
   - Go to Supabase Dashboard → Storage
   - Create a new **public** bucket named: `item-images`
   - Set to public access (dev only, as per PRD-002)

3. **Test auth flow**:
   - Visit your deployed site
   - Test magic link login
   - Verify cookies are set correctly
   - Test project/room/item creation

## Troubleshooting

### Build Error: "Missing Supabase environment variables"

**Cause**: Environment variables not set in Vercel.

**Fix**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables listed above
3. Redeploy

### Build Error: "Cannot find module '@prisma/client'"

**Cause**: Prisma Client not generated.

**Fix**: This should auto-generate during build. If not, add to `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Runtime Error: "Table 'projects' does not exist"

**Cause**: Database migrations not applied.

**Fix**: Run migrations:
```bash
npx prisma migrate deploy
```

### Image Upload Fails: "Bucket not found"

**Cause**: Storage bucket not created.

**Fix**: Create `item-images` bucket in Supabase Dashboard (see Post-Deployment Steps).
