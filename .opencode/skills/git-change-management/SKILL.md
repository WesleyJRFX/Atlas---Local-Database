---
name: git-change-management
description: >
  Use for git status/diff review, commits, branches, merges, rebases, pull
  requests, conflict resolution, release diffs, and protecting unrelated user
  changes while editing code.
---

# Git Change Management

## Purpose

Manage repository changes safely. Keep diffs focused, protect user work, and create clear commits/PRs only when requested.

## When To Use

- User asks about git status, diff, commit, branch, merge, rebase, PR, conflict, or release notes.
- Before committing or creating PRs.
- When editing in a dirty worktree.
- When a task may touch many files and scope control matters.

## Core Rules

- Do not commit, amend, push, force-push, rebase, or create PR unless explicitly requested.
- Always inspect `git status` and relevant `git diff` before committing.
- Preserve unrelated user changes; never revert files you did not intentionally change.
- Stage only intended files.
- Do not include secrets, generated junk, temp files, logs, or unrelated formatting.
- Do not skip hooks unless user explicitly instructs and accepts risk.

## Before Editing In Git Repo

- Check whether worktree is dirty when scope is broad.
- Note files already modified by user.
- Avoid overwriting user changes. If overlap exists, inspect diff and edit carefully.

## Commit Protocol

Only when user asks to commit:

1. Run `git status`.
2. Run `git diff` for unstaged changes.
3. Run `git log --oneline -10` to match commit style.
4. Verify tests/checks relevant to changed files.
5. Stage intended files only.
6. Run `git diff --cached`.
7. Commit with concise message matching repo style.
8. Report commit hash and verification.

## PR Protocol

Only when user asks for PR:

1. Inspect status, current branch, remote, tracking branch.
2. Inspect recent commits and diff from base branch.
3. Verify all commits included in PR are intended.
4. Run checks where feasible.
5. Use `gh` if available.
6. Return PR URL.

## Conflict Resolution

- Understand both sides before choosing.
- Preserve intended changes from both branches when possible.
- Run tests/build after resolving.
- Do not blindly accept ours/theirs for complex files.

## Diff Review Checklist

- Are changed files within requested scope?
- Any secrets or local paths?
- Any generated/temp/cache files?
- Any unrelated formatting?
- Any missing tests/docs/manifests?
- Any accidental deletions?
- Does diff tell coherent story?

## Final Response

Mention:

- git action performed;
- files/commit/PR involved;
- checks run;
- any uncommitted or unrelated changes left untouched.
