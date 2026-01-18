# PRD-004: Shuffle Mode (Containers + QR Assign)

## Status
DESIGN LOCKED

## Goal
Provide a staff-only “Shuffle Mode” used after/during pack-up to correct packing mistakes by moving items between containers using QR scans.

Flow:
1) Scan a source container QR
2) App shows items currently in that container
3) Staff filters list by title and selects items via checkboxes
4) Tap “Move”
5) Staff scans destination container QR OR creates a new container (room-scoped)
6) Confirm and perform move
7) Event log records each item move

Shuffle Mode is orthogonal to item decisioning (keep/donate/will/etc).

---

## Non-Goals
- Item decisioning (keep/donate/trash/will)
- Room switching within Inventory Mode (unchanged)
- Moving bulky items (items without containerId)
- Offline queue
- Client-facing UI

---

## Terminology
- “Container” = a box/tote/etc with a QR label and a stable containerId
- “Bulky item” = an item with no containerId (couch, microwave)

---

## Routes
All routes are project-scoped.


app/projects/:projectId/shuffle
app/projects/:projectId/shuffle/source
app/projects/:projectId/shuffle/destination


(Exact route structure can vary; must remain project-scoped.)

---

## Data / Entities (additive)

### Item
- containerId is nullable (already)
- Add:
  - handlingType: "containerable" | "bulky" (default "containerable")

### Container
- Must have:
  - id
  - projectId
  - roomId
  - code
- Must have a QR payload format (see below)

### New: ItemMoveEvent (minimal physical event log)
Table: item_move_events
- id (uuid)
- projectId
- itemId
- fromContainerId (nullable)
- toContainerId (nullable)
- movedAt (datetime)
- movedByUserId (string)

Rules:
- Shuffle Mode writes one event per moved item
- After writing event(s), Item.containerId is updated to toContainerId

Note:
This event model supports future “where was it” questions without mixing with decisioning.

---

## QR Code Requirements (Containers)
Each container must be scannable by camera.

QR payload must encode a container identity. Recommended:
- "container:{containerId}"

The app must validate:
- container exists
- container.projectId == current projectId

---

## Shuffle Mode UI / Flow

### Step 1: Enter Shuffle Mode
Route:

app/projects/:projectId/shuffle

UI:
- Large button: “Scan Source Container”
- Optional: manual entry field for container code (fallback)

---

### Step 2: Scan Source Container
Route:

app/projects/:projectId/shuffle/source

Behavior:
- Open camera scanner
- Read QR payload → resolve containerId
- Fetch:
  - container metadata (code, room)
  - items where item.containerId == containerId
- Show list view

---

### Step 3: Source Container Item List
UI:
- Header shows:
  - Source container code
  - Room name
- Search input:
  - filters items client-side by title (substring match)
- Item list:
  - checkbox per item
  - shows title + small thumbnail (if exists)
- Actions:
  - “Move” button disabled until at least 1 item selected
  - “Rescan source” to change source container

Rules:
- Only items currently assigned to this container are shown
- Bulky items (containerId null) do not appear

---

### Step 4: Choose Destination
After clicking “Move”:
Route:

app/projects/:projectId/shuffle/destination

UI offers:
- Primary: “Scan Destination Container”
- Secondary: “Create New Container”
  - If chosen, user selects destination room and system creates a container (respect existing code rules)
  - New container is auto-selected as destination

Rules:
- Destination container must be in the same project
- Destination container may be in a different room (allowed)
  - When moving items to a destination container in another room:
    - Item.roomId is updated to match destination container.roomId
    - This maintains invariant: item belongs to same room as container

---

### Step 5: Confirm Move
Before performing updates, show confirmation:

Example:
“Move 7 items from KITCHEN-BOX-0002 → PANTRY-BOX-0001”

Buttons:
- Confirm
- Cancel

---

### Step 6: Execute Move
On confirm:
For each selected item:
1) Insert item_move_event row
2) Update item.containerId to destination containerId
3) Update item.roomId to destination container.roomId (if different)

Success:
- Show success toast
- Offer:
  - “Move more from same source” (returns to list, clears selection)
  - “Scan new source”

---

## Authorization
All operations must validate server-side:
- project belongs to current user (ownerUserId == session.user.id)
- scanned container belongs to the project
- moved items belong to the project
- destination container belongs to the project

---

## Acceptance Criteria
1) Staff can scan a source container QR and see items assigned to it.
2) List supports filtering by title.
3) Staff can select items and move them to a destination container via scan.
4) Staff can create a new destination container as part of the move flow.
5) Confirm screen appears before move execution.
6) After move, items now appear under destination container list.
7) item_move_events are written for each moved item.
8) Bulky items (containerId null) do not appear in Shuffle Mode.

---

## Notes
- Shuffle Mode is physical correction only. Item decisioning is handled in a future Decision Mode.
