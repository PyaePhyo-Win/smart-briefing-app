---
name: frontend-datetime
description: 'Use when: adding, changing, or reviewing frontend date/time display, timestamps, logs, report metadata, labels, or formatting helpers. Enforces local-time formatting with date format yyyy-mm-dd and 12-hour AM/PM time format hh:mm:ss AM/PM in React, Next.js, TypeScript UI code.'
argument-hint: 'frontend timestamp/date/time formatting change'
---

# Frontend Date/Time Formatting

## Outcome

Frontend date and time UI consistently displays local time using:

- Date: `yyyy-mm-dd`
- Time: `hh:mm:ss AM/PM`
- Date + time: `yyyy-mm-dd hh:mm:ss AM/PM`

## When to Use

Use this skill when working in `frontend/` and the task involves:

- Rendering timestamps, dates, times, logs, activity rows, report metadata, or status history.
- Adding or changing frontend formatting helpers for `Date`, ISO strings, or event timestamps.
- Reviewing UI output that includes date/time text.

## Procedure

1. Inspect current timestamp flow.
   - Find where the timestamp value is created, stored, and rendered.
   - Prefer formatting at the display layer or through a shared frontend helper.
   - Keep API/SSE payloads unchanged unless explicitly requested.

2. Parse timestamp inputs safely.
   - Accept `Date`, ISO timestamp strings, or numeric epoch values only when expected by the component/helper.
   - Convert strings with `new Date(value)` and verify the result is valid before formatting.
   - Provide a simple fallback such as an empty string, `--`, or the original value only if the existing UI pattern expects it.

3. Always format in local time for frontend display.
   - Use local `Date` getters: `getFullYear()`, `getMonth() + 1`, `getDate()`, `getHours()`, `getMinutes()`, and `getSeconds()`.
   - Convert the local 24-hour value from `getHours()` to 12-hour AM/PM display: `period = hours >= 12 ? "PM" : "AM"` and `displayHour = hours % 12 || 12`.
   - Do not use `toISOString()` for displayed frontend date/time because it produces UTC.
   - Do not slice ISO strings for displayed time because that shows UTC values from backend timestamps.

4. Enforce exact output shapes.
   - Date: `yyyy-mm-dd`, for example `2026-07-07`.
   - Time: `hh:mm:ss AM/PM`, for example `09:05:03 AM` or `01:25:45 PM`.
   - Date + time: `yyyy-mm-dd hh:mm:ss AM/PM`, for example `2026-07-07 09:05:03 AM`.
   - Pad month, day, 12-hour display hour, minute, and second to two digits.
   - Use uppercase `AM` and `PM`.

5. Prefer reusable helpers.
   - For repeated usage, create or extend a frontend utility such as `formatLocalDate`, `formatLocalTime`, or `formatLocalDateTime`.
   - Keep helpers deterministic and dependency-free unless the project already standardizes on a date library.
   - Avoid locale-dependent output from `toLocaleString()` unless all required options and output shape are explicitly controlled and verified.

6. Preserve behavior and accessibility.
   - Do not change backend event schemas, stream parsing, or state lifecycle when only display formatting is requested.
   - Keep accessible text meaningful; avoid hiding date/time values behind visual-only elements.
   - If using `<time>`, set `dateTime` to the original machine-readable timestamp while visible text remains local formatted text.

7. Validate.
   - Check changed frontend files for TypeScript and lint errors when practical.
   - Review rendered examples or helper output to confirm local-time formatting.
   - Verify no displayed frontend timestamp uses UTC slicing or raw ISO strings unless intentionally machine-readable.

## Decision Points

- If the timestamp is displayed to users, format it in local time.
- If the timestamp is stored, sent to the backend, or used as a machine-readable value, preserve the original ISO or structured value.
- If only a time is needed, use `hh:mm:ss AM/PM` local time.
- If a full date is needed, use `yyyy-mm-dd` local date.
- If both are needed, use `yyyy-mm-dd hh:mm:ss AM/PM` local date/time.

## Completion Checks

- Frontend-visible dates use `yyyy-mm-dd`.
- Frontend-visible times use `hh:mm:ss AM/PM`.
- Frontend-visible date/time values are based on the user's local timezone.
- No display code slices ISO strings such as `timestamp.slice(11, 19)` for user-facing time.
- Backend/API/SSE contracts remain unchanged unless explicitly requested.
