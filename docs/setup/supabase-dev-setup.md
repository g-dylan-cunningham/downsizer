
---

# Step-by-step Supabase initial setup (dev)

This is the exact setup you need for PRD-001 and the next chunks.

## A) Create a Supabase project
1. Go to Supabase Dashboard
2. Create new project
3. Choose:
   - Organization: your personal org
   - Project name: `inventory-pwa-dev` (or similar)
   - Database password: generate and save it
   - Region: closest to you
4. Wait for provisioning

## B) Get API keys + URL for `.env.local`
1. In Supabase dashboard → **Project Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. (Optional later) copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`  
   - Do not use this in the browser

## C) Configure Auth for dev
1. Supabase dashboard → **Authentication** → **Providers**
2. Enable **Email**
3. Choose your sign-in style:
   - For magic links: ensure “Email link” is enabled (Supabase supports this via OTP/magic link flows)
4. Authentication → **URL Configuration**
   - Set **Site URL**:
     - dev: `http://localhost:3000`
   - Add **Redirect URLs**:
     - `http://localhost:3000/**`
     - (later) your Vercel preview + prod domains

## D) Create Storage bucket (public for dev)
1. Supabase dashboard → **Storage**
2. Create bucket named: `item-images`
3. Toggle: **Public bucket = ON** (dev only)
4. (Optional but recommended) set a file size limit if you want guardrails

## E) Get Postgres connection string for Prisma
1. Supabase dashboard → **Project Settings** → **Database**
2. Find **Connection string** (URI)
3. Use a “Direct connection” string if available, otherwise standard one
4. Put it into:
   - `DATABASE_URL=...`
5. Confirm it ends with `?schema=public` (add if missing)

## F) Verify Prisma can connect
From your repo:
1. `npx prisma db push` (once you have a schema)
2. If it fails:
   - confirm IP/network is allowed (usually fine)
   - confirm password is correct
   - confirm you used the correct host/port

---

## Next
If you want, I’ll produce **PRD-001** in the exact style Claude Code can execute quickly *and* a starter `schema.prisma` (Profile-only) plus a `.env.example`.
::contentReference[oaicite:0]{index=0}


