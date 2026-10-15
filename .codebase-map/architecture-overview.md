# Architecture overview

Generated 2026-10-14T03:01:30+00:00 from `C:\Users\charl\Documents\pricetrackr` at branch `main` and commit `1207da368deabbcc6d385472cade1b769fd30a09`.

## What this repository contains

- Languages: TypeScript (50), JSON (3), Markdown (3), JavaScript (2), CSS (1), Other (1)
- Frameworks: Next.js, React
- Package managers: npm-compatible
- Build systems: None detected
- Runtimes: Node.js / browser JavaScript
- Focus: Complete repository

## Important entry points and central files

- `app/products/PackageForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/products/PackageForm.tsx`. Incoming: 2, outgoing: 10.
- `app/prices/new/PriceForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/prices/new/PriceForm.tsx`. Incoming: 2, outgoing: 9.
- `app/products/ProductForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/products/ProductForm.tsx`. Incoming: 2, outgoing: 7.
- `app/stores/ShopForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/stores/ShopForm.tsx`. Incoming: 2, outgoing: 7.
- `app/products/page.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/products/page.tsx`. Incoming: 0, outgoing: 12.
- `app/check/[packageId]/page.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/check/[packageId]/page.tsx`. Incoming: 0, outgoing: 11.
- `app/prices/new/FormParts.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/prices/new/FormParts.tsx`. Incoming: 3, outgoing: 1.
- `app/products/ProductMemoEditor.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/products/ProductMemoEditor.tsx`. Incoming: 2, outgoing: 4.
- `app/products/VariationForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/products/VariationForm.tsx`. Incoming: 2, outgoing: 3.
- `app/products/actions.ts` — Source; Contains source code or project material. Located at `app/products/actions.ts`. Incoming: 2, outgoing: 3.
- `app/stores/ChainOptionsForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/stores/ChainOptionsForm.tsx`. Incoming: 2, outgoing: 3.
- `app/stores/CouponForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/stores/CouponForm.tsx`. Incoming: 2, outgoing: 3.
- `app/stores/actions.ts` — Source; Contains source code or project material. Located at `app/stores/actions.ts`. Incoming: 2, outgoing: 3.
- `eslint.config.mjs` — Configuration; Controls build, runtime, or tool behavior. Located at `eslint.config.mjs`. Incoming: 0, outgoing: 4.
- `next-env.d.ts` — Source; Contains source code or project material. Located at `next-env.d.ts`. Incoming: 2, outgoing: 3.
- `app/check/page.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/check/page.tsx`. Incoming: 0, outgoing: 8.
- `app/stores/StoreForm.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/stores/StoreForm.tsx`. Incoming: 2, outgoing: 2.
- `app/stores/page.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/stores/page.tsx`. Incoming: 0, outgoing: 8.
- `app/login/page.tsx` — Authentication; Establishes or enforces identity and access. Located at `app/login/page.tsx`. Incoming: 0, outgoing: 7.
- `app/prices/new/ChainExtras.tsx` — Frontend component / page; Renders user interface or page behavior. Located at `app/prices/new/ChainExtras.tsx`. Incoming: 2, outgoing: 1.

## Major components

### Frontend component / page

**What and why:** Renders user interface or page behavior. This role separates that responsibility from unrelated code.

**Files:** `app/products/PackageForm.tsx`, `app/prices/new/PriceForm.tsx`, `app/products/ProductForm.tsx`, `app/stores/ShopForm.tsx`, `app/products/page.tsx`, `app/check/[packageId]/page.tsx`…

**Connections and data:** Detected 8 incoming and 56 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Source

**What and why:** Contains source code or project material. This role separates that responsibility from unrelated code.

**Files:** `app/products/actions.ts`, `app/stores/actions.ts`, `next-env.d.ts`, `app/stores/couponActions.ts`, `app/check/[packageId]/actions.ts`, `app/products/memoActions.ts`…

**Connections and data:** Detected 8 incoming and 21 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Configuration

**What and why:** Controls build, runtime, or tool behavior. This role separates that responsibility from unrelated code.

**Files:** `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `package.json`, `postcss.config.mjs`

**Connections and data:** Detected 0 incoming and 5 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Test

**What and why:** Checks expected behavior. This role separates that responsibility from unrelated code.

**Files:** `lib/prices/coupon.test.ts`, `lib/prices/format.test.ts`, `lib/prices/schema.test.ts`, `lib/products/variation.test.ts`

**Connections and data:** Detected 0 incoming and 8 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Authentication

**What and why:** Establishes or enforces identity and access. This role separates that responsibility from unrelated code.

**Files:** `app/login/page.tsx`

**Connections and data:** Detected 0 incoming and 7 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Schema / validation

**What and why:** Validates or serializes data crossing a boundary. This role separates that responsibility from unrelated code.

**Files:** `lib/prices/schema.ts`

**Connections and data:** Detected 1 incoming and 1 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Other

**What and why:** Contains other code or project material. This role separates that responsibility from unrelated code.

**Files:** `app/globals.css`, `components.json`, `.env.example`

**Connections and data:** Detected 1 incoming and 1 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Utility

**What and why:** Contains utility code or project material. This role separates that responsibility from unrelated code.

**Files:** `lib/utils.ts`

**Connections and data:** Detected 0 incoming and 1 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

### Documentation

**What and why:** Explains project usage or architecture. This role separates that responsibility from unrelated code.

**Files:** `AGENTS.md`, `CLAUDE.md`, `README.md`

**Connections and data:** Detected 0 incoming and 0 outgoing local relationships. Inputs and outputs depend on the linked symbols and flows shown in the viewer.

**Change risk:** Callers, routes, configuration, and tests connected to these files may need coordinated updates.

## How to read this codebase

1. Read schema / validation: `lib/prices/schema.ts`.
2. Read test: `lib/prices/coupon.test.ts`, `lib/prices/format.test.ts`, `lib/prices/schema.test.ts`.

## Scope and exclusions

Analyzed 60 meaningful text files. Exclusions are recorded in `repository-map.json`; common caches, dependencies, generated output, binaries, media, model weights, and large files are intentionally not parsed.
