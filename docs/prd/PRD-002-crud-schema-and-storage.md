# PRD-002: CRUD Schema + Storage Upload (Staff PWA)

## Status
DESIGN LOCKED

## Goal
Enable staff to:
1. Create and manage Projects, Rooms, Containers, and Items
2. Upload item photos to Supabase Storage (public bucket, dev only)
3. View uploaded photos as thumbnails

This milestone establishes the **core data model and workflows** required for capture.
No AI, no embeddings, no offline queue yet.

---

## Non-Goals (Explicitly Out of Scope)
- Multi-user collaboration (single owner only)
- Client-facing views
- Movement / chain-of-custody events
- QR scanning
- RLS hardening (server-side checks only)
- Embeddings, AI, search ranking
- Offline / retry queue

---

## Locked Design Decisions

### Ownership & Collaboration
- **Single owner only**
- Every Project belongs to exactly one Supabase auth user
- No project members table yet
- System will be refactored later for multi-user support

### Room Association
- **Every Item must belong to a Room**
- Items cannot exist without a room
- Container creation also requires a room

### Container Codes
- Containers are auto-generated
- Codes should include room context **if feasible**
- Example formats:
  - `kitchen-BOX-0001`
  - `bedroom1-BOX-0003`
- If room-aware codes add too much complexity, fallback to:
  - `BOX-0001` per project
- Code must be unique within a project

---

## Core Entities (Prisma Models)

### Project
- `id` (uuid, pk)
- `ownerUserId` (string, Supabase auth user id)
- `name` (string)
- `createdAt` (datetime)

---

### Room
- `id` (uuid, pk)
- `projectId` (fk → Project)
- `name` (string)
- `slug` (string, derived server-side from name)
- `createdAt` (datetime)

**Constraints**
- `(projectId, slug)` unique

---

### Container
- `id` (uuid, pk)
- `projectId` (fk → Project)
- `roomId` (fk → Room, required)
- `seq` (int) — sequence per room (or per project if simplified)
- `code` (string) — human-readable container code
- `createdAt` (datetime)

**Constraints**
- `(projectId, code)` unique
- `(projectId, roomId, seq)` unique

---

### Item
- `id` (uuid, pk)
- `projectId` (fk → Project)
- `roomId` (fk → Room, required)
- `containerId` (fk → Container, nullable)
- `title` (string, optional)
- `kind` (string enum): `single | group`
- `count` (int, default = 1)
- `notes` (text, nullable)
- `createdAt` (datetime)

**Rules**
- Item creation requires a room
- Validate server-side:
  - room.projectId == item.projectId

---

### ItemImage
- `id` (uuid, pk)
- `itemId` (fk → Item)
- `path` (string, Supabase Storage path)
- `kind` (string enum): `thumb | display`
- `createdAt` (datetime)

---

## Routes / Screens

### `/app/projects`
- List projects owned by user
- Create project

---

### `/app/projects/:projectId`
- Project dashboard
- Links to:
  - Rooms
  - Containers
  - Items

---

### `/app/projects/:projectId/rooms`
- List rooms
- Create room
- Slug generated server-side

---

### `/app/projects/:projectId/containers`
- List containers
- Create container
  - Room selection required
  - Code auto-generated

---

### `/app/projects/:projectId/items`
- List items
  - Show room name
  - Show container code if assigned
- Create item
  - Room selection required
  - Minimal fields only

---

### `/app/projects/:projectId/items/:itemId`
- Item detail
- Upload photos
- Display thumbnails

---

## Storage Upload (Dev Mode)

- Bucket: `item-images` (public)
- Path pattern:
projects/{projectId}/items/{itemId}/{uuid}_{kind}.jpg


### Client-Side Image Handling
- Generate two versions before upload:
- `display`: ~1600–2000px long edge
- `thumb`: ~400–600px long edge
- Upload both
- Insert two ItemImage rows

---

## Authorization (Dev-Simple but Mandatory)

All reads/writes must validate server-side:
- Project belongs to user (`ownerUserId === session.user.id`)
- Room belongs to project
- Item belongs to project and room

No RLS policies required yet, but **never trust client input**.

---

## Acceptance Criteria

1. Logged-in user can create and list Projects
2. Within a Project, user can create and list Rooms
3. Containers:
 - Require selecting a Room
 - Auto-generate codes
4. Items:
 - Require selecting a Room
 - Cannot be created without a Room
5. Item detail supports image upload
6. Uploaded images appear as thumbnails after refresh
7. Unauthorized project access fails (404 or redirect)

---

## Notes
This PRD intentionally optimizes for:
- correctness
- clarity
- refactorability

It does NOT optimize for scale or polish yet.

