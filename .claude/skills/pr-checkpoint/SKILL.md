---
name: pr-checkpoint
description: Land a multi-block plan as a single draft GitHub PR with one commit per block and a per-block checklist that gates the next block on user review. Triggers when an approved plan splits into 3+ discrete commits and the user has asked to review incrementally (phrases like "open as a PR", "I want to review", "checkpoints", "step-by-step review").
---

# PR-checkpoint workflow

A protocol for shipping a multi-block implementation in a single draft
GitHub PR, where each block lands as one commit and pauses for human
review. Use this when the alternative (one mega-commit, one
mega-review) would lose comprehension.

## When to invoke

- Approved plan has **3 or more independent commit-sized blocks**.
- User has asked for staged review, checkpoints, or "let me review as
  you go".
- The work touches multiple layers (schema + routes + UI) where
  reviewing one layer at a time meaningfully reduces cognitive load.

If the plan is one small change, ship it as a normal PR — this workflow
adds overhead.

## Phase 1 — Open the draft PR before any code

1. Create a feature branch with a descriptive name:
   `git checkout -b feat/<short-slug>`
2. Make a single bootstrap commit. Acceptable contents:
   - This `SKILL.md` (if the project doesn't have it yet)
   - A `PR_CHECKLIST.md` or similar tracking file (optional)
   - Or an empty commit: `git commit --allow-empty -m "chore: open draft PR for <feature>"`
3. Push the branch.
4. Open the PR with `gh pr create --draft --base main --title "<feature title>" --body "$(cat <<'EOF' …)"` using the template below.
5. Capture the PR number from the gh output for later `gh pr edit` calls.

## PR description template

```markdown
## Summary
[2–3 sentence why. Reference the plan file path if one exists.]

## Blocks

Each block lands as one commit. After every push I pause and ask the
user to review the commit on GitHub. The next block doesn't start until
they thumbs-up or comment with specific changes.

- [ ] **0.** workflow setup (this PR + skill) — _bootstrap_
- [ ] **A.** [Title] — [scope]
- [ ] **B.** [Title] — [scope]
- [ ] **C.** [Title] — [scope]
- [ ] **D.** [Title] — [scope]

## Verification
End-to-end smoke after each block; details in the linked plan.

## Out of scope
[Anything explicitly deferred]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Phase 2 — Land each block

For each block in order:

1. **Implement**: write all the code/tests for ONE block. Don't bleed
   into the next block's surface.
2. **Verify locally**: typecheck and any block-specific smoke.
3. **Commit** using the message convention below.
4. **Push** to the feature branch.
5. **Tick the checkbox** in the PR body:
   ```bash
   gh pr view <PR#> --json body --jq .body \
     | sed 's/- \[ \] \*\*A\.\*\*/- [x] **A.**/' \
     | gh pr edit <PR#> --body-file -
   ```
6. **Comment on the PR** with a short summary of the commit and a clear
   ask for review:
   ```bash
   gh pr comment <PR#> --body "Block A pushed in <commit-sha>. Verify:
   - [thing 1]
   - [thing 2]
   Reply with ✅ to proceed to Block B, or with change requests."
   ```
7. **Wait for the user**. Do not start the next block until the user
   thumbs-up or responds with explicit feedback.
8. **Address feedback** as additional commits on the same branch. The
   block's checkbox stays ticked.

## Commit message convention

```
<scope>(<sub-area>): Block <X> <short title>

<3–5 line body. What changed and why, not how. Reference the plan
section if useful.>

Block <X> of #<PR#>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

`<scope>` is one of: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.
`<sub-area>` is the feature area (e.g. `meals`, `plan`, `auth`).

## Phase 3 — Final merge

When all blocks are ticked and the user has approved the final block:

1. `gh pr ready <PR#>` — mark the PR ready for review
2. Tell the user the PR is ready; ask if they want to merge themselves
   or want you to.
3. If asked to merge: `gh pr merge <PR#> --squash --delete-branch`
   (squash by default — the per-block commits are valuable in the PR
   review surface but a squashed commit on main is easier to revert).
4. Delete the local feature branch and `git fetch --prune`.

## Anti-patterns

- **One mega-commit**. Defeats the point — there's nothing to review
  block-by-block.
- **Skipping the draft state**. The PR looks merge-ready before it is,
  and reviewers may approve in haste.
- **Moving past a checkpoint without explicit approval**. If you don't
  know whether the user approved, ask — never assume.
- **Mixing unrelated changes**. Each commit should match exactly one
  plan block. Drive-by cleanups go in their own commit at the end.
- **Force-pushing inside a checkpoint**. The user is reviewing the
  commit history; rewriting it after review pulls the rug.
- **Long quiet periods**. Even a "still on Block C, hit a snag with X,
  thinking about Y" message beats silence.

## Trust-but-verify checklist before each commit

- [ ] Typecheck passes (`pnpm typecheck` or equivalent)
- [ ] No accidentally-staged files outside this block's scope
  (`git status` before commit)
- [ ] Commit message matches the convention
- [ ] If this block adds env vars or DB migrations, the PR body or
  comment flags them so the reviewer knows what to apply.
