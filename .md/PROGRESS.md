# Progress Log


## Current Phase

Phase 1 complete (manual entry and price lookup, live on Vercel). Now: small improvements, then Phase 2 planning.


## Done

- Steps 1 to 60 are in PROGRESS_ARCHIVE.md (same folder, not loaded by Aider). Summary: login and owner-only account, stores and branches, chain coupons, membership prices and bonus points, product variations and memo, price entry with inline new product and branch, price check and product detail pages, tax basis, unit price, bulk tiers, point-use option, demo mode and roles, themes, barcodes and the scan page, search with aliases, favorites, counter-word units, toasts, home dashboard, admin tools (merge, brands, units, suggestions), legacy prices of merged products.
- Step 61 (Phase 1 second close-out: .gitignore and .prettierignore extended and tsconfig.tsbuildinfo and .codebase-map no longer tracked; the unused addProduct and the empty app/products/action.tsx deleted; whole project formatted with Prettier in one formatting-only commit; .env.example checked against the code; live deploy and phone smoke test passed) done
- Step 62 (docs: PART1_FOUNDATION.md cleaned up: the duplicate Empty search section and the outdated /admin/merge placeholder line removed, the Coupons and Membership bullets updated for the Step 42 price strip; the old PROGRESS.md moved to PROGRESS_ARCHIVE.md and a new PROGRESS.md started; handoff lines about Aider loading and the PROGRESS.md update brought up to date) done


- Step 63 (/scan polish in components/BarcodeScanner.tsx: a torch button only where the camera reports torch support, a short vibration on a successful read where the device has one (Android), no sound anywhere, a clearer unsupported message on iPhone and iPad) done


- Step 64 (price history on the product detail page: lib/prices/history.ts buildHistory with tests (lowest, average, highest and the newest price against the average, same tax basis only, entered prices, legacy prices ignored); components/PriceHistoryChart.tsx draws a hand-made SVG chart you can tap or drag, for all chains and, when 2 or more chains have prices, a second chart for the chain of the newest price; the detail page loads up to 500 prices for the charts) done


## In Progress

- (none)


## Next Up

- Plan Phase 2 (freshness score, trust score, unit price per 100 ml / per sheet)
- Speed, later: check that Fluid compute is on (Vercel, Settings, Functions); consider Vercel Speed Insights.
- Wishlist: edit the size or unit of a package, show the logo inside the app, option to rank by normal price instead of the discounted price


## Known Issues

- (none yet)



## Decisions Log    