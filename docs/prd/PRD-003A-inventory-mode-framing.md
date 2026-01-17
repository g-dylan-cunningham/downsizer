# PRD-003A: Inventory Mode Framing & Navigation Model

## Status
DESIGN LOCKED

## Purpose
This document extends PRD-003 to formalize **Inventory Mode** as a focused, Android-first operational mode and to define how **containers are actively managed during inventory capture**.

Inventory Mode is the only implemented mode at this stage.

---

## Core Insight
Inventory capture is a **physical, room-based workflow**:
- Staff work in one room at a time
- Items are placed into one of a small number of nearby containers
- Speed and correctness matter more than browsing or flexibility

Therefore:
- Project context is fixed
- Room context is fixed
- A small, active set of containers is managed inline

---

## Mode-Based Architecture (Conceptual)

### Modes
- Inventory Mode (staff, on-site, Android-first) — IMPLEMENTED
- Review & Sort (client, async) — FUTURE
- Find Item (staff/client) — FUTURE
- Project Admin (low-frequency) — FUTURE

No UI, routes, or logic for future modes should be implemented yet.

---

## Navigation Model (Option C — Locked)

### No global CRUD navigation
The application MUST NOT expose persistent navigation for:
- Projects
- Rooms
- Items
- Containers

These are data entities, not user intents.

---

## Entry Flow
1. User logs in
2. User selects a Project
3. User enters Inventory Mode

Once Inventory Mode is entered:
- Project context is fixed
- Room context is fixed
- Project and room switching are not allowed

---

## Inventory Mode

### Route
app/projects/:projectId/inventory


This route represents a **mode**, not a generic page.

---

## Inventory Mode UI Chrome

### Required
- Project name (read-only)
- Room name (read-only)
- Clear “Inventory Mode” indicator
- Primary capture UI
- Container selector (see below)
- Explicit **Exit Inventory** action

### Explicitly excluded
- Global navigation bars
- Object-level tabs (Projects, Rooms, Items, Containers)
- Breadcrumbs
- Cross-mode links

---

## Room Handling (Locked)
- A room must be selected before entering Inventory Mode
- **Room cannot be changed while in Inventory Mode**
- To change rooms:
  1. User exits Inventory Mode
  2. Returns to Project Dashboard
  3. Re-enters Inventory Mode with a different room

This prevents accidental cross-room inventory errors.

---

## Container Handling (NEW – Locked)

### Core Rule
While in Inventory Mode, the user may work with **up to 6 active containers** associated with the current room.

Containers are selected explicitly and applied to items at capture time.

---

### Container Selector (Inventory Mode)

#### UI
- Dropdown selector labeled “Active Container”
- Shows container code (e.g. KITCHEN-BOX-0003)
- One container is always selected when capturing items

#### Behavior
- User may:
  - Select from existing containers in the room
  - Create a new container inline (if fewer than 6 active)
- Maximum active containers at one time: **6**
- If 6 containers already exist:
  - “Create new container” is disabled or hidden

---

### Container Assignment
- Every captured Item in Inventory Mode is assigned:
  - projectId (implicit)
  - roomId (implicit)
  - containerId (from selector)
- containerId is written at item creation time

---

### Container Scope Rules
- Only containers belonging to the current room are selectable
- Containers from other rooms are never shown
- Changing room requires exiting Inventory Mode (containers reset on re-entry)

---

## Exit Inventory Behavior
- **Exit Inventory** always returns the user to:

app/projects/:projectId

(Project Dashboard)

---

## Project Dashboard (Mode Hub)

### Route


app/projects/:projectId


Purpose:
- Orient the user
- Act as the only place for mode switching

### Allowed actions
- Enter Inventory Mode
- Resume Inventory (if applicable)
- Manage rooms and containers (non-inventory context)
- (Future) Review & Sort
- (Future) Find Item

---

## Resume Inventory

If a user previously exited Inventory Mode:
- Dashboard should show a **Resume Inventory** affordance
- Resume returns the user to:

app/projects/:projectId/inventory

using:
- the last selected room (if still valid)
- the last selected container (if still valid)

---

## CRUD Views: Supporting Role Only
CRUD screens:
- Exist only to support workflows
- Are reachable via contextual links
- Must preserve project context
- Must never become primary navigation

---

## Guardrails (Hard Rules)
- Inventory Mode must not allow project switching
- Inventory Mode must not allow room switching
- Inventory Mode must not expose global CRUD navigation
- Inventory Mode must support container selection inline
- Item creation in Inventory Mode must assign containerId
- Speed and correctness take priority over flexibility

---

## Acceptance Criteria
1. Inventory Mode shows no global CRUD navigation
2. User cannot switch projects or rooms in Inventory Mode
3. User can select from up to 6 containers for the active room
4. User can create new containers inline until limit is reached
5. Captured items are assigned to the selected container
6. Exiting Inventory returns to Project Dashboard
7. Resume Inventory restores last room and container (if valid)
8. Inventory Mode feels like a focused, purpose-built tool

---

## Rationale
This design:
- Matches real mover/packer behavior
- Reduces mis-boxing errors
- Keeps Inventory Mode fast and deliberate
- Avoids premature complexity while supporting real-world packing




