---
name: frontend-icons
description: 'Use when: adding, replacing, or reviewing frontend visual symbols, status marks, buttons, alerts, empty states, or UI labels. Enforces using lucide-react icon components instead of emojis or decorative Unicode glyphs in React, Next.js, TypeScript, Tailwind UI code.'
argument-hint: 'frontend component or UI change'
---

# Frontend Icons

## Outcome

Frontend UI uses accessible `lucide-react` icon components instead of emojis, emoji-like pictographs, or decorative Unicode glyphs.

## When to Use

Use this skill when working in `frontend/` and the task involves:

- Status indicators, success/error/warning states, loading states, alerts, badges, buttons, labels, panels, or empty states.
- Adding visual symbols to React/Next.js components.
- Replacing existing emoji characters or plain text glyphs such as check/cross marks.
- Reviewing UI polish for consistency and accessibility.

## Procedure

1. Inspect the target component and nearby components for existing icon patterns.
   - Prefer `lucide-react` icons for frontend UI symbols.
   - If `lucide-react` is not installed and the task requires adding app code icons, add/request that dependency according to the project dependency workflow instead of using emojis or decorative glyphs.
   - Reuse any existing local icon wrapper/import pattern if present.

2. Detect disallowed symbols.
   - Search changed frontend files for emoji Unicode ranges and emoji-like pictographs.
   - Treat literal emoji characters in JSX text, labels, placeholders, alt text, markdown, or constants as issues.
   - Also replace decorative plain glyphs such as `✓`, `✕`, `⚠`, `★`, and similar when used as UI icons.

3. Choose the replacement.
   - Import the closest semantic icon from `lucide-react`, e.g. `Check`, `X`, `AlertTriangle`, `LoaderCircle`, `Info`, or `Star`.
   - Use Tailwind classes such as `h-* w-*`, `shrink-0`, and state color classes; let icons use `currentColor`.
   - Match the existing design language with consistent size and stroke width.

4. Make icons accessible.
   - Decorative icons: add `aria-hidden="true"` and keep descriptive text visible nearby.
   - Meaning-carrying icons without visible text: add an accessible label on the surrounding control or include `title`/screen-reader text.
   - Do not rely on color or icon shape alone for status; keep text labels such as `STATUS_LABELS[status]`.

5. Preserve UI behavior and styling.
   - Keep existing state logic, loading animations, spacing, and Tailwind color semantics.
   - Icons should inherit text color with `currentColor` unless a clear state color is already used.
   - Avoid layout shifts by setting fixed icon dimensions and `shrink-0`.

6. Validate.
   - Run TypeScript/lint checks when practical for frontend changes.
   - Re-scan modified frontend source files for emojis or decorative glyphs.
   - Check that no backend/API behavior or SSE contract changed.

## Decision Points

- Use `lucide-react` as the preferred and approved icon library for frontend UI icons.
- Do not use emojis or decorative Unicode glyphs such as `✓`, `✕`, `⚠`, `★`, and similar as UI symbols.
- If a symbol is part of user-generated content or report markdown from the backend, do not rewrite it unless the request explicitly targets rendered frontend chrome.
- If the symbol is semantic text rather than decoration, preserve text meaning and add a visual `lucide-react` icon only if useful.

## Completion Checks

- No emojis or decorative Unicode glyphs are introduced in `frontend/` UI code.
- UI symbols are implemented as accessible `lucide-react` icon components.
- Existing status text remains visible for screen readers and users.
- Styling remains consistent with the current Next.js + Tailwind components.
