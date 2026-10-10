# Conventions

Explain tradeoffs before picking an approach — don't just silently choose one. Assume no prior security/infra expertise on the human side.

## Security
- Never hardcode secrets. Use env vars; confirm `.env` is in `.gitignore`.
- Validate/sanitize all user input, especially anything in the photo-upload → AI pipeline.
- Parameterized queries only — never string-concatenated SQL.
- RLS enabled on every Supabase table holding user data; explain the policy when a table is created.
- Rate-limit any endpoint that triggers AI processing or auto-search.
- Explain security tradeoffs for anything touching auth, file uploads, or external APIs.

## Code quality
- Small, testable functions — no do-everything functions.
- Unit tests for: price parsing, price-per-unit calculation, freshness score, auth.
- Prefer well-maintained popular libraries over custom code for security/parsing logic.
- Keep schema normalized — no duplicated price/product data without a stated reason.

## Process
- Auth/payments/user-data features: plan in `/ask` mode first, don't go straight to `/code`.
- After any security-relevant diff: explicitly review it for vulnerabilities before it's accepted.
- One feature/fix per commit — no sprawling diffs.
- If a request is ambiguous, especially for data-model changes: ask, don't assume.

## Project notes
- Dataset grows over time — prefer extensible designs over "complete but rigid" ones.
- Price data has real-world nuance (sales, regions, package sizes) — flag any simplification to comparison logic rather than silently applying it.
