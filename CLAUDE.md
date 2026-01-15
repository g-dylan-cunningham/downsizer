# CLAUDE.md — Project Implementation Guide

This repo builds an Android-first PWA for a “retirement home moving / inventory” service.
Claude Code is used for implementation. ChatGPT is used for PRDs/specs.

## Tech Stack (initial)
- Next.js (App Router)
- JavaScript (not TypeScript)
- Prisma ORM
- Supabase Postgres
- Supabase Auth
- Supabase Storage (public bucket during dev only)
- Tailwind (keep UI simple & extensible)

## Core Principles
1. Ship working vertical slices fast (auth → CRUD → images → capture → QR → search).
2. Prefer simple, boring solutions over clever ones.
3. Make workflows reliable:
   - During MVP: safe server writes and explicit user feedback for uploads.
   - Later: add offline/local queue + retry.
4. Keep data model stable and explicit (Prisma schema is source of truth).
5. Optimize for the current PRD. Avoid future-proofing that adds complexity without immediate payoff.

## Product Vision (North Star — do not implement all at once)
This system supports a white-glove downsizing service:
- Staff capture items via Android PWA (photos + minimal metadata).
- Items are assigned to containers (boxes/totes) via QR.
- A chain-of-custody event log provides “where is it?” truth.
- Clients later review items and decide disposition (keep/donate/trash/sell/store/will/assign heir).
- Search supports natural language queries by returning item cards, using hybrid retrieval (metadata + embeddings).

### Intended Core Entities (names matter)
- Project, Room, Item, ItemImage, Container, MovementEvent, Person, Decision

### Item lifecycle states (future)
- captured → packed → stored/moved → disposed (donated/trashed/sold) or delivered
Dispositions:
- keep | donate | trash | sell | store | will

### AI integrations (future, not now)
- Vision-assisted title/category/attributes
- Embeddings per item for semantic search
- Hybrid retrieval in Postgres/pgvector

### Design constraints (do now)
- Build in vertical slices with minimal schema changes.
- Prefer additive migrations.
- Keep permissions simple in dev; harden later.
- Avoid premature multi-tenancy, job assignment, complex roles.

## Documentation Requirements (strict)

### File-level docs
Every non-trivial file must begin with a header comment:
- Purpose
- Key exports
- Important invariants / assumptions

Example:
```js
/**
 * Purpose: Item capture server actions for creating items + attaching photos.
 * Exports: createItem(), attachItemImage().
 * Invariants:
 * - All writes require an authenticated session.
 * - projectId is verified server-side (never trust client input).
 */
