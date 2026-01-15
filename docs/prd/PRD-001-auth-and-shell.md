```md
# PRD-001: Auth + App Shell (Staff PWA)

## Goal
Provide a working staff-facing PWA with:
- Supabase Auth login
- Protected `/app` area
- Minimal navigation shell
- Basic “Projects” page placeholder

This PRD intentionally does NOT include CRUD schema beyond a minimal `Profile` row (optional).

## Non-goals
- Items, rooms, containers, images
- Offline support
- RLS perfection
- Client-facing views

## Primary Users
- Staff user (you / spouse) using Android Chrome PWA

## UX Requirements
- App installs to home screen (PWA basics)
- Login page accessible publicly
- Logged-in users land on `/app/projects`

## Auth Method
Use **Email Magic Link** (passwordless) unless implementation friction is high.
If friction is high, fall back to email+password.

### Magic link flow
1. User enters email
2. Click “Send link”
3. User taps link in email on phone
4. App opens and session is established
5. Redirect to `/app/projects`

## Routes
Public:
- `/login` — login UI and status messages

Protected:
- `/app` — base app layout (nav shell)
- `/app/projects` — placeholder page showing current user + “No projects yet” message

## Navigation Shell (minimal)
In protected layout:
- Top bar showing app name and user email
- Links:
  - Projects
  - (disabled/placeholder) Rooms
  - (disabled/placeholder) Items
  - (disabled/placeholder) Containers
- Logout button

## Data Entities (minimal)
### Profile (optional but recommended)
Purpose: keep a stable row for user metadata.

Fields:
- `id` (uuid) primary key
- `userId` (string/uuid) unique (maps to Supabase auth user id)
- `email` (string)
- `createdAt` (datetime)

If you skip Profile, it’s fine for PRD-001; but you will likely want it later.

## Implementation Notes
### Supabase client usage
- Use Supabase JS client in browser for login calls.
- For protected routes, validate session server-side in layout (preferred) OR client-side guard with redirect.

### Prisma requirement
- Use Prisma for the Profile table only (if implementing Profile).
- Prisma uses `DATABASE_URL` pointing at Supabase Postgres.

### PWA requirement
- Add a minimal manifest + icon so “Add to Home Screen” works.
- Do not spend time on service worker caching yet.

## Acceptance Criteria (testable)
1. Visiting `/login` shows an email input and “Send link” button.
2. Submitting email triggers Supabase magic link request and shows a success message.
3. Clicking the magic link signs the user in and redirects to `/app/projects`.
4. Visiting `/app/projects` while logged out redirects to `/login`.
5. Protected layout shows user email and a Logout button.
6. Clicking Logout returns the user to `/login` and protected routes redirect again.
7. PWA manifest exists and Chrome offers “Install app” (or “Add to Home screen”).

## Smoke Test Checklist
- [ ] `/login` loads
- [ ] magic link email arrives
- [ ] link opens app and logs in
- [ ] `/app/projects` loads and shows user
- [ ] logout works
- [ ] direct navigation to `/app/projects` while logged out redirects

## Deliverables
- Auth working
- Protected shell routes in place
- Minimal PWA installability
- Documentation comments at file level and inline where non-obvious

## Suggested Files (guidance, not mandatory)
- `lib/supabase/client.js` — browser client factory
- `lib/auth/session.js` — session helpers
- `app/(public)/login/page.js`
- `app/(app)/app/layout.js` — protected layout
- `app/(app)/app/projects/page.js`
- `public/manifest.webmanifest`
- `public/icons/*`
