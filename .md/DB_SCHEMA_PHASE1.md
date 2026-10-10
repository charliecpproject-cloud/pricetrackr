# Database Schema — Phase 1 (draft, for review before migrating)

Five tables. Nothing here commits you to anything — flag anything you want changed before this becomes an actual Supabase migration in Step 4 of `BUILD_PLAN_PHASE1.md`.

## store_chains
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | `default gen_random_uuid()` |
| name | text, not null | e.g. "LIFE" |
| created_at | timestamptz | `default now()` |

## shops
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| store_chain_id | uuid, FK → store_chains.id | not null |
| name | text, not null | branch name, e.g. "Nerima" |
| address | text | nullable |
| region | text | nullable, free text for now (ward/prefecture) — a formal region table is Part 3 scope, not needed yet |
| created_at | timestamptz | `default now()` |

## products
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name_ja | text | nullable |
| name_en | text | nullable |
| brand | text | nullable |
| category | text | nullable |
| created_at | timestamptz | `default now()` |

**App-level rule (not a DB constraint):** at least one of `name_ja`/`name_en` must be filled in on save.

## product_packages
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| product_id | uuid, FK → products.id | not null |
| package_size | numeric, not null | e.g. 500 |
| package_unit | text, not null | e.g. `ml`, `g`, `count` |
| created_at | timestamptz | `default now()` |

Unique constraint on `(product_id, package_size, package_unit)` to stop accidental duplicate packages.

## price_observations
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| product_package_id | uuid, FK → product_packages.id | not null |
| shop_id | uuid, FK → shops.id | not null |
| price | numeric, not null | `check (price >= 0)` |
| currency | text, not null | `default 'JPY'` |
| observed_at | timestamptz, not null | `default now()` |
| is_sale | boolean, not null | `default false` |
| source | text, not null | `default 'manual'`, `check (source in ('manual'))` for now — widen the check constraint, don't drop it, when AI/community sources are added |
| status | text, not null | `default 'active'`, `check (status in ('active'))` for now — same widen-don't-drop rule |
| submitted_by | uuid, FK → auth.users.id | nullable in Phase 1 (single owner); make not-null when a second user exists |
| notes | text | nullable |
| created_at | timestamptz | `default now()` |

Insert-only table — the app must never `UPDATE` a price value, only insert new rows.

## RLS policy shape (all five tables)

Phase 1 has one authenticated user (you), so policies can be simple:

- `SELECT`: allowed for any authenticated user.
- `INSERT`/`UPDATE`/`DELETE`: allowed only where `auth.uid()` matches the session — for `price_observations`, tie this to `submitted_by = auth.uid()` once that column is populated; for the other four tables (no owner column), restrict to `auth.role() = 'authenticated'` is acceptable for Phase 1 since only you have an account.

This is intentionally permissive-but-authenticated rather than fully user-scoped, because user-scoping doesn't mean anything yet with one user — but every table still has RLS *on*, per `CONVENTIONS.md`, so turning on real per-user scoping later is a policy change, not a schema change.

## Open questions for you to decide before finalizing

1. **`region` as free text vs. a fixed list** (prefecture/ward) — free text is faster to ship now but means messier data later if you ever want to filter/group by region. Given Phase 1 is manual entry by you alone, free text is probably fine; flag if you'd rather constrain it now.
2. **Currency as fixed `'JPY'` vs. a real column** — schema above already treats it as a real column with a JPY default, so this is future-proofed either way; no action needed unless you want to hardcode it as a literal instead (not recommended, costs nothing to keep it a column).
3. **Should `product_packages.package_unit` be a free-text column or a constrained enum** (`ml`, `g`, `count`, etc.)? A `check` constraint with an allowed list catches typos early; free text is more flexible if you'll need units you haven't thought of yet. Either is fine for Phase 1 — this is cheap to tighten later, cheap to leave loose now.

None of these block starting Step 4 — they're refinements, not blockers.
