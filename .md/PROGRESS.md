# Progress Log


## Current Phase

Phase 1 complete (manual entry and price lookup, live on Vercel). Now: small improvements, then Phase 2 planning.


## Done

- Steps 1 to 60 are in PROGRESS_ARCHIVE.md (same folder, not loaded by Aider). Summary: login and owner-only account, stores and branches, chain coupons, membership prices and bonus points, product variations and memo, price entry with inline new product and branch, price check and product detail pages, tax basis, unit price, bulk tiers, point-use option, demo mode and roles, themes, barcodes and the scan page, search with aliases, favorites, counter-word units, toasts, home dashboard, admin tools (merge, brands, units, suggestions), legacy prices of merged products.
- Step 61 (Phase 1 second close-out: .gitignore and .prettierignore extended and tsconfig.tsbuildinfo and .codebase-map no longer tracked; the unused addProduct and the empty app/products/action.tsx deleted; whole project formatted with Prettier in one formatting-only commit; .env.example checked against the code; live deploy and phone smoke test passed) done
- Step 62 (docs: PART1_FOUNDATION.md cleaned up: the duplicate Empty search section and the outdated /admin/merge placeholder line removed, the Coupons and Membership bullets updated for the Step 42 price strip; the old PROGRESS.md moved to PROGRESS_ARCHIVE.md and a new PROGRESS.md started; handoff lines about Aider loading and the PROGRESS.md update brought up to date) done


- Step 63 (/scan polish in components/BarcodeScanner.tsx: a torch button only where the camera reports torch support, a short vibration on a successful read where the device has one (Android), no sound anywhere, a clearer unsupported message on iPhone and iPad) done


- Step 64 (price history on the product detail page: lib/prices/history.ts buildHistory with tests (lowest, average, highest and the newest price against the average, same tax basis only, entered prices, legacy prices ignored); components/PriceHistoryChart.tsx draws a hand-made SVG chart you can tap or drag, for all chains and, when 2 or more chains have prices, a second chart for the chain of the newest price; the detail page loads up to 500 prices for the charts) done


- Step 65 (edit the size or unit of a package, admin only: the update_package database function (checks the admin role, refuses duplicates), app/products/packageEditActions.ts, the edit sheet app/products/EditPackageForm.tsx opened from the admin-only edit button in the package list of ProductCardTools; the package keeps its id so prices, barcodes and favorites stay attached) done


- Step 66 (price check: the new option cmp=normal makes the cheapest badge and the price range use the entered price instead of the price after coupon or membership; the choice is in the filter panel (app/check/CompareFilter.tsx), part of the URL like the other filters, default is the discounted price; Filters has a new compare field) done


- Step 67 (detail page: the unit price line is hidden for a single piece, like on the price check cards, in the latest price card and in the history rows; the bundle label in the unit price line is shortened, since the bundle price is already shown in the bulk block) done


- Step 68 (price entry: the continuous entry mode (renzoku nyuryoku) now keeps the date and time after a save, so a batch from an older date keeps its date; the now button still sets the current time) done


- Step 69 (new product with variations and capacities in one go: lib/products/structure.ts parser with limits (5 variations, 6 packages per group, 8 attributes) and tests; lib/products/saveStructure.ts saves the variations and then all packages; price entry: the new-product panel has an optional variation (attribute rows), an existing product can get a new variation too (pick the new-variation option), an identical variation is reused; the add product page has an optional variations and packages editor (components/StructureFields.tsx, readStructureForm in lib/products/structureForm.ts)) done


- Step 70 (product page and price check: every product card on the product page has an add-price link to /prices/new?product=<id>; the product page has a filter and sort panel (category and brand dropdowns with the 30 most used values and counts, price records yes/no for logged-in users, variations yes/no, sort by name, newest added or newest price; lib/products/listFilters.ts with tests, list loaded up to 300 and shown 20 at a time); the price check page has a sort option (cheapest, newest price, favorites first; lib/prices/sort.ts with tests; a chosen sort loads and sorts up to 100 products and the default 3-product view is replaced by the full list) done


- Step 71 (barcode scan on iPhone and iPad: components/BarcodeScanner.tsx uses the browser BarcodeDetector where it exists (Android) and otherwise loads the barcode-detector npm package (WebAssembly, the .wasm file comes from the jsDelivr CDN) with a dynamic import, so Android never downloads it; the unsupported message now only shows if that fails to load; PART1_FOUNDATION.md and the handoff updated; tested on an iPhone) done


- Step 72 (speed measuring: Vercel Fluid compute checked (on); Vercel Speed Insights added (@vercel/speed-insights, the SpeedInsights component in app/layout.tsx, enabled in the Vercel project); the first scores are 100 for /, /check and /prices/new) done


- Step 73 (speed code review, no code change: getClaims() is already used in lib/auth/viewer.ts and proxy.ts (only the settings page and its three actions still call getUser(), left as they are); the home, 価格確認 and 価格入力 pages already fetch in parallel with Promise.all; skipped on purpose: theme in a cookie (it saves very little) and lazy-loading the 価格入力 data (the catalogue is small, and searching on the phone works without a signal)) done


- Step 74 (価格確認 filter panel: components/FilterGroup.tsx, a group heading with a small ⓘ button that opens the helper sentence; used by 価格帯, 価格の比べ方, 並び順 and 店舗のカテゴリ; 並び順 is on one line with the labels 標準, 安い順, 新しい順 and お気に入り (visitors get 3 columns)) done


- Step 75 (scan: a found barcode now opens the 価格確認 search for the code (/check?q=<code>), so the card shows the latest price at every chain with its age and a 価格を追加 button on each 容量, instead of jumping to 価格入力; lookupBarcode returns the code; the scan page text, PART1_FOUNDATION.md and the handoff updated) done


## In Progress

- (none)


## Next Up

- Plan Phase 2 (freshness score, trust score, unit price per 100 ml / per sheet)
- (none)
- Bulk tidy for category and brand


## Known Issues

- (none yet)



## Decisions Log    