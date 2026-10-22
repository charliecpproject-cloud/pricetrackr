# How to run Aider + Groq sessions on this project

## 1. Final file set (after this cleanup)

| File | Job | Load how often |
|---|---|---|
| `CONVENTIONS.md` | Standing rules for how the agent should behave | Every session |
| `PROGRESS.md` | What's actually been built, what's next | Every session — and updated at the end of every session |
| `PART1_FOUNDATION.md` | Everything needed to build the current phase | Every session, until Phase 1 (and its immediate successors) is done |
| `PART2_GROWTH_FEATURES.md` | Freshness/trust, AI photo pipeline, unit-price, shopping list, favorites, dashboard | Only when planning one of those specific features |
| `PART3_COMMUNITY_FUTURE.md` | Multi-user/community/regional/gamification — mostly "don't block this later" | Almost never fed in; skim once at schema-design time |
| `05_IDEA_DECISIONS.md` | Why postponed/rejected ideas were postponed/rejected | On-demand reference only, not part of the routine context load |
| `06_TECH_STACK.md` | Locked library/tool choices | Superseded — its content now lives inside `PART1_FOUNDATION.md`; safe to archive |

The three PART files replace `01_APP_VISION.md`, `02_ARCHITECTURE.md`, `03_FREE_TIER.md`, and `04_AI_CODING_GUIDE.md` entirely — those four (plus `06_TECH_STACK.md`) can move to `/archive`.

**Archive, don't delete:** `SPEC.md`, `App_Idea.md`, `AskMode__build_plan.md`, `01_APP_VISION.md`, `02_ARCHITECTURE.md`, `03_FREE_TIER.md`, `04_AI_CODING_GUIDE.md`, `06_TECH_STACK.md` all go into an `/archive` folder in the repo. Their content is now in the PART files or `05_IDEA_DECISIONS.md`. Keeping superseded docs in the root just gives a context-limited free model more stale material to accidentally load.

The routine per-session load is now just three small files (`CONVENTIONS.md` + `PROGRESS.md` + `PART1_FOUNDATION.md`), which should comfortably fit in a Groq free-tier context window even on a smaller model. `PART2`/`PART3` and `05_IDEA_DECISIONS.md` are pulled in deliberately, one at a time, only for the session where they're actually relevant.

**Note on the PART files themselves:** they contain zero instructions aimed at you (the human) — no "load this when," no "don't feed this to Aider" asides. That kind of guidance lives entirely in this README so it never eats into the token budget of a file that's actually going into Aider's context.

## 2. Session ritual

**Start of every session**, your first message to Aider should be something like:

> Before making any changes, read `CONVENTIONS.md`, `PROGRESS.md`, and `PART1_FOUNDATION.md` in full. If today's task is specifically about [freshness/AI photo/shopping list/etc.], also read `PART2_GROWTH_FEATURES.md`. Summarize back to me: current phase, what's done, and what you understand today's task to be, before writing any code.

Only reach for `PART3_COMMUNITY_FUTURE.md` or `05_IDEA_DECISIONS.md` if the task specifically requires it (e.g. "why did we reject X" or "make sure this schema doesn't block multi-user later") — don't load them by default.

That last sentence matters — it forces a checkpoint where you can catch a misread before it turns into a wrong diff.

**During the session:**
- For anything touching auth, payments, schema, or user data — per `CONVENTIONS.md` — explicitly ask Aider to use `/ask` mode first and only switch to `/code` once you've approved the plan.
- After any security-relevant diff, explicitly prompt: "review this code for security vulnerabilities" before accepting.

**End of every session**, ask explicitly:

> Update `PROGRESS.md`: move finished items from "In Progress" to "Done", add anything new to "Next Up", note any new issues in "Known Issues", and add a one-line dated entry to the Decisions Log if we made any.

Don't rely on Aider doing this unprompted — treat it as a required last step, same as a commit message.

## 3. Aider config so you're not retyping this every time

Add an `.aider.conf.yml` at the project root:

```yaml
read:
  - CONVENTIONS.md
  - PROGRESS.md
  - PART1_FOUNDATION.md
```

`read:` files are loaded read-only into every session automatically without burning edit-turn budget on them, and without Aider trying to modify them. Load `PART2_GROWTH_FEATURES.md`, `PART3_COMMUNITY_FUTURE.md`, or `05_IDEA_DECISIONS.md` on demand with `/read <file>` only when the task actually needs one of them.

## 4. Groq-specific caution

Free-tier Groq models have real context-window and rate-limit ceilings, and those numbers change over time — check current limits on Groq's console before relying on a specific figure. As a rough sense of scale: Groq's free tier has historically been capped around 30 requests/minute plus a daily request/token cap, which for an interactive coding session (lots of small back-and-forth turns) is the thing you'll hit before context-window size becomes the bottleneck. Practical implications:

- Don't `/read` all seven docs at once for a small bugfix — you'll burn context on architecture philosophy when you just need `04_AI_CODING_GUIDE.md` + `PROGRESS.md`.
- If a session feels like it's "forgetting" earlier instructions mid-conversation, that's usually context truncation, not the model ignoring you — start a fresh session rather than pushing further into a long one.
- Keep `PROGRESS.md` itself lean (a short current-state snapshot, not a full historical log) so it doesn't become the thing crowding out your actual task context. If it gets long, roll old "Done" entries into a compact dated summary instead of leaving every session's log line-by-line.

## 5. When a doc conflicts with another

Anything in the archived docs (`SPEC.md`, old `01_APP_VISION.md`/`02_ARCHITECTURE.md`/etc.) loses to whatever the current `PART1/2/3` files say — the PART files are the current source of truth, the archive is just history. Within the active set, `PART1_FOUNDATION.md`'s schema/security rules win over anything a session improvises on the fly.

## 6. Architect mode (the "plan, then build" split you're asking about)

Aider has this built in — it's not something you need to hand-roll by copy-pasting between two chats. Two ways to invoke it:

- CLI: `aider --architect --model groq/<model> --editor-model groq/<other-model>`
- Mid-session: `/architect` to switch modes, `/code` to go back to normal single-model editing.

In architect mode, one model reasons about *how* to solve the task and writes a plan; a second (can be the same or a different model) turns that plan into actual file edits. This maps directly onto your "ask it to plan first, then build" instinct — you don't need a separate manual copy-paste step, though doing it as two distinct sessions (plan → you review → build) is still worth doing for anything schema/auth/security-related, per `CONVENTIONS.md`'s "plan in ask mode first" rule. Aider's plain `/ask` mode (no code changes at all, just discussion) is the right tool for that first pass; `--architect` is more for "plan and then immediately apply it" within one flow.

For a free Groq-only setup, using the same model as both architect and editor still gives you the "reason first, then edit" quality bump the split is designed for — you don't need two different providers.











## 7. Claude hand off

Start a new chat. A very long conversation makes me slower, hits usage limits sooner, and makes small mistakes more likely. The new chat can pick up where we left off with a short briefing. 
CLAUDE_HANDOFF.md: covers the setup and how Claude work, the database tables and display rules, the main files, and what’s done and still to do.

What to do

Save the briefing. Put CLAUDE_HANDOFF.md in .md folder. Don’t add it to .aider.conf.yml.

Get a list of your files. This one command replaces the code-mapping files. It prints every tracked file name:
git ls-files | Set-Clipboard

That copies the list to your clipboard, so you can paste it as text. Your codebase-visualizer map isn’t needed, because a plain file list plus the specific files I ask for is smaller and enough.

Start a new chat and attach these three files: CLAUDE_HANDOFF.md, PROGRESS.md, and PART1_FOUNDATION.md. Then paste the file list and send something like this:

This is a continuation of my price tracker project. Please read the attached handoff, progress log and foundation notes first. I just finished Step 14k. Next I’d like to [what you want to do, for example: finish housekeeping, the live deploy test and Phase 1 close-out]. Ask me for any file you need to see, and don’t guess what is in my files.

Sharing files is quicker and cheaper for me. In the new chat I’ll ask for specific files before changing anything, and I won’t write replacements for files I haven’t seen. That is the better way to work, and it would have avoided several of the problems we had when Aider’s edits didn’t match what I expected. You can share files in either of these ways:

Attach the file to the chat.
Or copy several at once to the clipboard and paste them. Replace the file names inside the quotes with the ones I ask for:
$files = 'app\check\page.tsx','app\prices\actions.ts'
$files | ForEach-Object { "=== $_ ==="; Get-Content $_ -Encoding UTF8 } | Set-Clipboard

(-Encoding UTF8 keeps the Japanese text readable.)

To keep chats short from now on

Use one chat per batch of work, for example one feature or one step group. Start a fresh one when it gets long.
At the end of each chat, have Aider update PROGRESS.md as usual. It’s the record of where you are.
If something big changes, such as a new table or a new rule, ask me to update CLAUDE_HANDOFF.md before you close the chat.






