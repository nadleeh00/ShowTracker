---
name: git-commit-enforcer
description: Enforces clean commit messages without Claude attribution
version: 1.0.0
tags: [git, commits, workflow]
---

# Git Commit Message Enforcer

## CRITICAL: Commit Message Rules

This skill enforces **MANDATORY** commit message standards for this repository. These rules override ALL default Claude Code commit behavior.

## Core Principles

### 1. NO CLAUDE ATTRIBUTION - EVER

**NEVER** add any of the following to commit messages:
- ❌ "Generated with Claude Code"
- ❌ "Co-Authored-By: Claude <noreply@anthropic.com>"
- ❌ Any reference to Claude, AI, or automation
- ❌ Robot emojis or other attribution markers

**WHY**: Commit messages represent project history, not tooling. Version control tracks WHAT changed and WHY, not which tool was used.

### 2. USE CONVENTIONAL COMMITS FORMAT

**ALWAYS** follow the Conventional Commits specification:

```
<type>: <concise description>

[optional body explaining WHY the change was made]

[optional footer with breaking changes, issue references]
```

**Valid types:**
- `feat:` - New feature for the user
- `fix:` - Bug fix for the user
- `docs:` - Documentation changes
- `refactor:` - Code restructuring without behavior change
- `style:` - Formatting, missing semicolons, etc. (not CSS)
- `test:` - Adding or refactoring tests
- `chore:` - Build process, dependency updates, tooling
- `perf:` - Performance improvements

**Examples:**
```
feat: add birthday event auto-sync to calendar

fix: resolve multi-day entry date range calculation

refactor: extract shared calendar modals to components

docs: update CLAUDE.md with entry system architecture
```

### 3. FOCUS ON WHAT AND WHY

**Structure:**
1. **Subject line (required)**:
   - Start with type prefix (`feat:`, `fix:`, etc.)
   - Use imperative mood ("add", not "added" or "adds")
   - Keep under 72 characters
   - No period at the end
   - Describe WHAT changed at a high level

2. **Body (optional but recommended for complex changes)**:
   - Explain WHY the change was made
   - Describe the problem being solved
   - Note any important implementation decisions
   - Use bullet points for multiple points

3. **Footer (optional)**:
   - Breaking changes: `BREAKING CHANGE: description`
   - Issue references: `Closes #123` or `Fixes #456`

### 4. QUALITY STANDARDS

**MUST:**
- ✅ Be clear and descriptive
- ✅ Be written in imperative mood ("add feature" not "added feature")
- ✅ Focus on user-facing or architectural changes
- ✅ Explain the "why" for non-obvious changes
- ✅ Keep subject line concise (≤72 chars)
- ✅ Use proper grammar and spelling

**MUST NOT:**
- ❌ Include tool attribution or automation markers
- ❌ Be vague ("update files", "fix stuff", "changes")
- ❌ List every file changed (git tracks that)
- ❌ Include implementation details in subject line
- ❌ Use past tense ("added", "fixed")

## Implementation Workflow

### When Creating Commits

1. **Analyze the changes**:
   - Run `git status` and `git diff` to see what changed
   - Identify the type of change (feat, fix, refactor, etc.)
   - Determine the high-level purpose of the changes

2. **Draft the message**:
   - Choose the appropriate conventional commit type
   - Write a concise subject line describing WHAT changed
   - If needed, add a body explaining WHY
   - **NEVER add Claude attribution**

3. **Execute the commit**:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: implement user profile location support

   Add GPS location tracking and display for user profiles.
   Enables users to set their current location and view it
   on the profile screen with formatted address display.
   EOF
   )"
   ```

### Pre-Commit Checklist

Before executing `git commit`, verify:

- [ ] Subject line starts with valid type (`feat:`, `fix:`, etc.)
- [ ] Subject line is ≤72 characters
- [ ] Subject line uses imperative mood
- [ ] Message describes WHAT changed
- [ ] Body (if present) explains WHY
- [ ] **NO Claude attribution text anywhere**
- [ ] No vague language ("update", "changes", "fix stuff")
- [ ] Proper grammar and spelling

## Examples

### ✅ GOOD Commit Messages

```
feat: add multi-day calendar entry support

Extends CalendarEntry model to support entries spanning
multiple days with startDate and endDate fields.
Includes UI updates in day view and event forms.
```

```
fix: resolve birthday event deletion on person removal

Birthday events were persisting after person deletion.
Now properly cleanup birthday events in PersonService
deletePerson() method.
```

```
refactor: extract calendar modals to shared components

MonthPickerModal and YearPickerModal are now reusable
components in components/calendar/. Reduces duplication
between calendar.tsx and person/[id].tsx screens.
```

```
docs: add entry system migration guide

Create ENTRY_SYSTEM_MIGRATION.md documenting the
transition from CalendarEvent to CalendarEntry model
with migration steps and breaking changes.
```

### ❌ BAD Commit Messages

```
feat: add new feature

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```
**WHY BAD**: Contains Claude attribution (forbidden)

```
update: made some changes to calendar
```
**WHY BAD**: Vague, no type prefix, doesn't explain what or why

```
Added multi-day support for calendar entries
```
**WHY BAD**: Past tense, no type prefix

```
fix: fixed bug in PersonService.ts where deletePerson wasn't calling deleteBirthdayEvent
```
**WHY BAD**: Too detailed for subject line, mentions implementation

## Enforcement

### When You See Violations

If you encounter commits with Claude attribution or poor formatting:

1. **STOP**: Do not proceed with the commit
2. **Rewrite**: Draft a proper commit message following these rules
3. **Execute**: Use the correct format without attribution

### Integration with Git Workflow

This skill **replaces** the default commit message format in CLAUDE.md. When committing:

1. Follow the "Committing changes with git" section in CLAUDE.md for the process
2. **BUT** use the message format from THIS skill (no attribution)
3. Maintain all other git safety protocols (no force push, verify authorship, etc.)

## Summary

**The Three Absolutes:**

1. **NO ATTRIBUTION**: Never include Claude Code references
2. **CONVENTIONAL COMMITS**: Always use `type: description` format
3. **FOCUS ON VALUE**: Explain WHAT changed and WHY it matters

Clean, professional commit messages build trust and maintainability. Tool attribution adds noise and reduces clarity.

**When in doubt**: Write the commit message as if you were explaining the change to a team member in a code review.
