# PRD-003: Capture Flow (Staff PWA)

## Status
DESIGN LOCKED (defaults chosen for speed)

## Goal
Provide a fast, phone-first capture workflow for staff to inventory items in a home:
- Select Project + Room once
- Capture item photos quickly
- Create an Item in the selected Room
- Upload images (thumb + display) to Supabase Storage
- Return to capture screen for next item with minimal taps

This builds on PRD-002 entities and Storage behavior.

---

## Non-Goals
- QR scanning / container assignment
- Offline/local queue (later milestone)
- AI categorization or embeddings
- Movement/custody logs
- Client-facing decision UI

---

## UX Principles
- Minimize taps
- Room context remains “sticky” during a session
- Always show upload progress and success/failure
- If upload fails, do not lose the created Item; allow retry on the detail page

---

## Capture Modes
### 1) Single Item
Use for: jewelry, photos, furniture, unique items.
- Creates Item: kind = `single`, count = 1

### 2) Group Item
Use for: mugs, pencils, books, utensils.
- Creates Item: kind = `group`, count = user-entered integer (required)
- Photos are representative

---

## Routes / Screens

### A) Capture entry
Route: `/app/projects/:projectId/capture`

Purpose:
- Choose Room (required)
- Start capture loop

UI:
- Room dropdown (rooms in project)
- Two buttons:
  - “Capture Single”
  - “Capture Group”

Sticky state:
- Remember last selected room per project in localStorage:
  - key: `lastRoomId:{projectId}`

---

### B) Capture screen (single)
Route: `/app/projects/:projectId/capture/single?roomId=...`

UI:
- Photo picker/camera capture:
  - Allow 1+ photos
  - Require at least 1 photo OR allow “no photo” with confirm (default: require photo)
- Fields:
  - Title (optional; placeholder “(optional) Blue mug…”)
  - Notes (optional)
- Primary action: “Save & Next”
- Secondary action: “Save & View Item” (takes you to item detail)

Behavior on Save:
1. Create Item with required fields:
   - projectId
   - roomId
   - kind = `single`
   - count = 1
   - title, notes
2. For each selected image:
   - Generate `display` and `thumb` versions client-side
   - Upload both to Storage
   - Create ItemImage rows for both
3. Show success toast
4. Clear form and stay on capture screen (same room)

Failure handling:
- If Item create succeeds but uploads fail:
  - Show error and link button: “Open item to retry uploads”
  - Do not discard the item

---

### C) Capture screen (group)
Route: `/app/projects/:projectId/capture/group?roomId=...`

UI:
- Photo picker/camera capture (representative photos)
- Fields:
  - Title (recommended; default “Group item”)
  - Count (required; integer >= 2)
  - Notes (optional)
- Actions same as single

Creates Item:
- kind = `group`
- count = user-entered

---

## Storage / Images
Same as PRD-002:
- Bucket: `item-images` (public dev)
- Upload path:
  - `projects/{projectId}/items/{itemId}/{uuid}_{kind}.jpg`
- Image variants:
  - `display`: 1600–2000px long edge
  - `thumb`: 400–600px long edge
- Create ItemImage row per variant:
  - kind = `display` or `thumb`

Compression/resize requirements:
- Client-side resize before upload (avoid full-res S24 photos)
- Keep implementation simple:
  - use canvas-based resizing
  - jpeg/webp acceptable

---

## Data / Validation Rules
- roomId required
- kind is `single` or `group`
- single items forced count=1
- group items require count >= 2
- ItemImage rows reference correct itemId
- Server-side authorization:
  - project belongs to current user
  - room belongs to project

---

## Acceptance Criteria (testable)
1. Staff can open `/app/projects/:projectId/capture`, select a room, and start capture.
2. Room selection is required; cannot capture without a room.
3. Single capture creates an Item in the chosen room and uploads at least one photo.
4. Group capture requires count >= 2 and creates an Item with kind=group and that count.
5. After “Save & Next”, the UI resets for the next capture and keeps the same room selected.
6. Uploaded photos appear on the Item detail page as thumbnails.
7. If image upload fails, the Item still exists and user can retry by going to item detail.
8. Capture flow remains usable on Android Chrome (PWA installed or browser).

---

## Implementation Notes
- Prefer minimal new abstractions.
- Use the same upload helper used in PRD-002 (if present).
- Keep routing and state simple; localStorage for last room is sufficient.
