# Price Intelligence App — Idea & Decision Log

**Purpose:** Preserve product reasoning so future AI agents and future versions of the project understand not only what we decided, but why.

**Decision rule:** A rejected idea is not necessarily bad. It may simply be premature, unnecessary for the current phase, too expensive, risky, or incompatible with the zero-budget strategy.

---

## Status definitions

- **APPROVED** — part of the product direction
- **APPROVED — LATER** — desired, but intentionally postponed
- **DEFERRED** — needs more research
- **REJECTED** — currently not planned
- **EXPERIMENT** — worth prototyping before committing

---

# Product ideas

## 1. Personal price tracking

**Status:** APPROVED

**Reason:** Core purpose of the application.

Users need to record product, price, location/shop, date, quantity, and related metadata.

---

## 2. Product/package separation

**Status:** APPROVED

**Reason:** Essential for correct unit-price comparison.

A 500ml product and 1L package may represent the same product but are different sellable packages.

---

## 3. Store chain + physical shop separation

**Status:** APPROVED

**Reason:** A chain such as LIFE or Summit has many branches.

The database must support chain-level and branch-level analysis.

---

## 4. Japanese + English product data

**Status:** APPROVED

**Reason:** Japan-first product, but internationalization should not require a later data migration.

---

## 5. Freshness score

**Status:** APPROVED

**Reason:** A price without a sense of age can be misleading.

Freshness should remain distinct from trust.

---

## 6. Trustworthiness score

**Status:** APPROVED

**Reason:** Users need to know whether information is approved, AI-derived, user-submitted, repeatedly confirmed, etc.

---

## 7. Recent observation history

**Status:** APPROVED

**Reason:** Showing several recent observations makes the current price understandable instead of presenting an unexplained number.

---

## 8. Unit price

**Status:** APPROVED

**Reason:** Often more useful than sticker price.

Examples: ¥/100g, ¥/100ml, ¥/piece.

---

## 9. AI image → price data

**Status:** APPROVED — EARLY PRIORITY

**Reason:** Manual entry for every shelf item would make the owner's workflow too slow.

The intended workflow is photograph → AI extraction → human review → approved data.

---

## 10. AI data automatically trusted

**Status:** REJECTED

**Reason:** AI can misread prices, package sizes, products, promotions, or shelf labels.

AI submissions should enter a pending state.

---

## 11. Temporary uploaded image deletion

**Status:** APPROVED

**Reason:** Images are expensive relative to structured price data and are usually only needed for short-term extraction/review.

Target retention is approximately 24 hours unless an image is deliberately retained.

---

## 12. Internet intelligence for product metadata

**Status:** APPROVED — LATER/ITERATIVE

**Reason:** Internet sources can help identify product names, images, sizes, brands, and other metadata.

It should not automatically turn external information into trusted price observations.

---

## 13. Internet price scraping as a core V1 feature

**Status:** REJECTED FOR V1

**Reason:** External price information introduces freshness, legality/terms, source reliability, package differences, and technical complexity.

The initial product should work extremely well using owned observations.

It may be added later as a separate source type.

---

## 14. Price alerts

**Status:** APPROVED — LATER

**Reason:** Very useful once multiple observations/users provide meaningful changes.

Low value when the only user already knows the prices they personally entered.

---

## 15. Regional comparison

**Status:** APPROVED — LATER

**Reason:** Valuable after enough independent regional observations exist.

Not especially useful during single-user development.

---

## 16. User credibility score

**Status:** APPROVED — PUBLIC-LAUNCH PHASE

**Reason:** Community data needs a way to distinguish reliable contributors from spam.

The score should be based on underlying contribution/verification events, not just a manually updated number.

---

## 17. Verification/upvote system

**Status:** APPROVED — PUBLIC-LAUNCH PHASE

**Reason:** Users can confirm that a price observation is accurate.

This creates an evidence layer similar to crowdsourced real-time services.

---

## 18. Credibility decays to zero after inactivity

**Status:** REJECTED

**Reason:** A reliable user who takes a month away should not suddenly become completely untrustworthy.

A future model can use slow decay, rolling windows, or separate recent-activity indicators.

---

## 19. Simple verification count as the entire trust system

**Status:** REJECTED

**Reason:** Ten low-quality accounts should not necessarily outweigh one highly reliable contributor.

Future verification should consider verifier credibility, independence, timing, and other signals.

---

## 20. Unlimited contribution XP

**Status:** REJECTED

**Reason:** Users could spam observations or upload an entire shelf and gain excessive XP.

Contribution rewards need diminishing returns, quality weighting, and/or limits.

---

## 21. Gamification

**Status:** APPROVED — LATER

**Reason:** A level, contribution history, achievements, and percentile ranking can make repeated data collection enjoyable.

But gamification must never reward low-quality data more than accurate data.

---

## 22. Top 0.1% contributor ranking

**Status:** APPROVED — LATER / EXPERIMENT

**Reason:** Could make contribution feel meaningful.

However, rankings should measure quality and useful coverage, not raw volume.

---

## 23. Biggest price drop dashboard

**Status:** APPROVED

**Reason:** Directly useful and becomes increasingly valuable as the dataset grows.

During single-user mode it can still highlight changes in the owner's own observations.

---

## 24. AI shopping assistant

**Status:** APPROVED — LATER

**Reason:** Once the database contains enough reliable structured information, natural-language questions become powerful.

Examples:

- "Is ¥398 a good price?"
- "Which milk is cheapest per 100ml?"
- "What should I buy today?"

The assistant must query actual application data rather than inventing prices.

---

## 25. User can choose own data only

**Status:** APPROVED — LATER

**Reason:** Some users may not want crowdsourced information.

---

## 26. User can choose geographic scope

**Status:** APPROVED — LATER

**Reason:** Different users care about different geographic areas.

Possible scopes:

- own observations
- neighborhood
- selected nearby neighborhoods
- city/ward
- prefecture
- national
- custom radius

---

## 27. User-defined "good deal"

**Status:** APPROVED — LATER

**Reason:** A good deal is subjective.

One user may want:

> below personal historical average

Another may want:

> bottom 20% of regional prices

The system should eventually support configurable definitions.

---

## 28. User-defined freshness

**Status:** APPROVED — LATER

**Reason:** A user may consider a grocery price from 7 days ago useful while another requires 1-day-old data.

---

## 29. Worldwide launch

**Status:** APPROVED — LONG TERM

**Reason:** The architecture should be internationalization-ready.

However, Japan is the initial product market.

---

## 47. Shopping list function

**Status:** APPROVED — LATER

**Reason:** Turns stored price data into purchase guidance, but depends on a reasonably mature product/price dataset to be useful. For a generic request (e.g. "hand soap") the system should surface several plausible matches/price ranges rather than force one answer; for a specific brand+size request it can resolve to a concrete product. Intended purpose is helping the user estimate a shopping trip's cost, not replacing their own choice.

---

## 48. Favorites / restock tracking

**Status:** APPROVED — LATER

**Reason:** Lets a user pin products they buy repeatedly and eventually run out of (e.g. a specific detergent brand/size) so they can check current price or get a restock nudge without re-searching. Builds directly on the product/price foundation once it exists — no new domain concepts required.

---

# Technical ideas

## 30. Microservices from the beginning

**Status:** REJECTED

**Reason:** Too much complexity for a single-user free-tier application.

Use a modular monolith with clean domain boundaries.

Split services only when measured scale requires it.

---

## 31. Redis from the beginning

**Status:** REJECTED

**Reason:** Adds infrastructure and cost/complexity before there is a demonstrated need.

---

## 32. Dedicated search engine from the beginning

**Status:** REJECTED

**Reason:** PostgreSQL search is sufficient for the initial dataset.

Introduce specialized search only when measured requirements justify it.

---

## 33. Permanent shelf-photo storage

**Status:** REJECTED BY DEFAULT

**Reason:** Images consume storage and bandwidth and are not necessary for every observation.

Keep images temporarily unless deliberately retained as evidence.

---

## 34. AI as a hard dependency

**Status:** REJECTED

**Reason:** The core app must survive provider outages, quota exhaustion, model changes, or pricing changes.

---

## 35. Provider-specific AI code throughout the app

**Status:** REJECTED

**Reason:** Makes provider replacement difficult.

Use provider adapters/interfaces.

---

## 36. Store current price directly on product

**Status:** REJECTED

**Reason:** Prices are observations and change over time.

Current price should be derived from relevant observations.

---

## 37. Store every derived metric permanently

**Status:** REJECTED BY DEFAULT

**Reason:** Wastes database space and creates synchronization problems.

Calculate inexpensive metrics from source data.

Materialize only when performance requires it.

---

## 38. Build for millions of users immediately

**Status:** REJECTED

**Reason:** Premature complexity.

Build a clean architecture that can migrate/scale later.

---

## 39. Free-tier monitoring and guardrails

**Status:** APPROVED

**Reason:** Zero-budget operation requires awareness of database, storage, bandwidth, AI, and CI usage.

---

# New ideas to evaluate later

## 40. Product barcode scanning

**Status:** EXPERIMENT / LATER

Potentially very valuable for product identification and duplicate prevention.

Needs evaluation of barcode availability and scanning UX.

---

## 41. Receipt scanning

**Status:** EXPERIMENT / LATER

Could extract many purchases at once.

Needs careful distinction between purchase price, shelf price, discounts, taxes, and package identity.

---

## 42. Shelf-photo multi-product extraction

**Status:** APPROVED — LATER THAN BASIC AI EXTRACTION

A single image could produce many candidate products.

However, contribution limits and quality controls must prevent a single batch from generating excessive XP or flooding the database.

---

## 43. Shrinkflation detection

**Status:** APPROVED — FUTURE

Compare historical package quantity and unit price.

Example:

> 500g → 450g while sticker price remains unchanged.

This is a strong example of the app providing intelligence rather than merely storing prices.

---

## 44. "Should I buy now?"

**Status:** APPROVED — FUTURE

Potential recommendation based on historical price distribution, freshness, and confidence.

Must explain its reasoning.

---

## 45. Deal score

**Status:** APPROVED — FUTURE

Potentially combine:

- current price
- historical distribution
- unit price
- freshness
- trust
- regional comparison

Should be explainable rather than a mysterious number.

---

## 46. Community price manipulation resistance

**Status:** APPROVED — REQUIRED BEFORE PUBLIC LAUNCH

Potential threats:

- fake low prices
- fake high prices
- repeated spam
- mass uploads
- coordinated voting
- duplicate observations
- fake accounts

The public system must remain useful even when some data is malicious.

---

# Decision principle

When considering a new feature, ask:

> **Does this make the core price-intelligence experience better, and can we support it without damaging data quality, scalability, privacy, performance, or the zero-budget goal?**

If the answer is "not yet," record the idea rather than forcing it into the current release.
