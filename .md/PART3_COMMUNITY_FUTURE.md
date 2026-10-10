# PART 3 — Distant future (community, multi-user, maybe never)

Design reference, not a build list — some of this may never ship.

## Multi-user & auth
Additional Supabase Auth accounts, role-based admin privileges (owner stays admin-by-default).

## Credibility
Event-based, not a single mutable number: store `contribution_events`/`verification_events`/`quality_events`, calculate credibility from them. Must not decay to zero from inactivity alone; weight quality over volume.

## Verification / upvotes
A verification record retains verifier, observation, vote, timestamp, evidence, and verifier trust level — not a simple thumbs-up count. Ten low-quality accounts must never outweigh one reliable contributor.

## Anti-abuse at scale
Rate limits, daily/weekly contribution caps, diminishing XP returns, outlier/duplicate detection, suspicious-account flags, moderation queue. One user (or one shelf photo) must never flood the dataset or dominate a product's "current price."

## Gamification
Level/XP/streaks/rank — reward quality and useful coverage, never raw volume. Build only once real usage exists to design against.

## Regional intelligence & personalization
Per-user geographic scope (own data → neighborhood → prefecture → nationwide), user-defined "good deal"/"freshness" thresholds, community-data visibility toggle. Needs a `region`/`scope` concept on shops and a preferences table on users eventually — don't build the UI now, just don't structure shops so region can't be added.

## Worldwide launch
Japan-first stays the identity for the foreseeable future; data model just shouldn't hardcode JPY/Japan at the type level. Not an active goal.

## Before any public launch
Full re-audit of every provider's current pricing/limits/acceptable-use — nothing in PART1's free-tier numbers should be trusted as still valid by then. Manipulation resistance (fake prices, mass uploads, coordinated voting) must be designed before opening beyond yourself, not after.
