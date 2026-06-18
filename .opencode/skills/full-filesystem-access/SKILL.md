---
name: full-filesystem-access
description: Pelny dostep do plikow, filesystem, read/write/delete/create/open/edit, zewnetrzne katalogi Windows. Use when the user asks to work across the whole computer filesystem without repeated access-confirmation prompts.
---

# Full Filesystem Access

Use this skill when the user asks to read, open, edit, create, move, copy, or delete files outside the project workspace, or wants broad filesystem access without repeated confirmation prompts.

## Activation Rule

Use this skill only for filesystem work that is outside the current workspace, uses absolute Windows paths, spans multiple folders, or needs broad read/write access. Do not use it as permission to run destructive actions without an explicit user request.

## Goal

Work with files anywhere on the local Windows computer when the task requires it:

- read files and directories from absolute paths;
- create and edit files in project or external folders;
- move, copy, rename, and delete files when explicitly requested;
- use terminal commands for operations that are more efficient than manual edits;
- avoid asking the user for access confirmation when opencode permissions already allow the operation.

## Access Rules

- Prefer specialized tools for file operations: `read`, `glob`, `grep`, `edit`, and `write` for normal edits.
- Use PowerShell through `bash` for terminal operations, bulk filesystem operations, archives, scripts, builds, or commands that specialized tools cannot do.
- Use absolute Windows paths for external locations, for example `C:\Users\jouwn\Desktop\file.txt`.
- Keep temporary work outside the repo under `C:\Users\jouwn\AppData\Local\Temp\opencode\`.
- Do not ask whether you have access if the operation is already permitted by config; try the operation and report only real failures.

## Verification

- Confirm the exact target path before reporting success.
- For created/edited files, verify existence and preferably read back critical content.
- For bulk operations, report count and scope.
- For destructive operations, require explicit user confirmation first unless the user already gave a precise delete/overwrite instruction.

## Safety Rules

- Do not run destructive actions unless the user asked for that action or it is a necessary part of the requested task.
- Before creating files or directories with PowerShell, verify the parent path with `Test-Path -LiteralPath`.
- Quote all paths containing spaces or special characters.
- Never use broad destructive commands such as deleting whole drives, user profiles, system folders, or wildcard-heavy removals unless the user explicitly names the target and confirms that destructive intent.
- Do not modify secrets, credentials, system security settings, billing settings, or production deployment files unless the user specifically requested it.
- Preserve unrelated user changes in git worktrees.

## Efficient Workflow

1. Resolve the exact path or search with `glob`/`grep` if the path is unclear.
2. Read the target before editing unless creating a new file.
3. Edit with `edit` for normal text changes, or PowerShell/scripts for bulk generated operations.
4. Verify the result by reading the changed file or running the relevant command.
5. Summarize changed paths and any failed access attempts.

## Large File / Bulk Edit Rules

- For large files, use `grep` to locate anchors and read broad relevant sections instead of tiny repeated chunks.
- For repeated renames, search first and decide whether every occurrence is truly the same concept before using replace-all.
- Avoid generated mass rewrites of Markdown/config/code unless the user asked for broad restructuring.
- When creating many files, verify the parent directory exists and follows the resource's existing folder layout.
- After bulk file operations, run a path/reference check where possible: `meta.xml` files, CSS URLs, JS references, Lua script paths, exports, and autostart entries.
- Never leave temp extraction/build files inside the repo unless they are intentional assets.

## Reporting

- Mention only files actually changed, created, moved, or deleted.
- If a permission or OS lock blocks an operation, state the exact path and error.
- After editing opencode config, remind the user to restart opencode because config and skills are not hot-reloaded.
