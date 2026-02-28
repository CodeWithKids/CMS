# Frontend Improvements Before Backend

This document lists improvements to complete on the frontend **before** (or in parallel with) moving to backend/API work. Doing these now will make the app more robust, consistent, and easier to connect to real APIs later.

---

## 1. Quick wins (low effort, high impact)

| Item | What to do |
|------|------------|
| **Document title** | In `index.html`, the comment says "TODO: Set the document title". The `<title>` is already "Code With Kids LMS"; consider aligning with branding (e.g. "CWK Hub") and removing the TODO. |
| **Admin learner detail – term selector** | Add a **term selector** (Term 1, Term 2, Term 3) on `/admin/learners/:id`, like the organisation learner detail page, so admin can view attendance and enrolment per term, not only current term. |
| **Inventory list – checkout status** | On `/inventory`, for items with `status === "checked_out"`, show **"Checked out by [Name] since [date]"** (and optional due date). Use secondary text or a badge so status is obvious. |
| **Educator sidebar** | Per Educator Sidebar Navigation prompt: streamline to Dashboard, Schedule, Team schedules, Profile, Earnings, Inventory; remove "My classes" and "My devices" from sidebar and add a short line on the Dashboard: *"Your classes and devices are below."* |

---

## 2. Loading, empty, and error states

**Why:** Once you add a real API, you need these everywhere. Adding them now (even with mock data) avoids blank screens and makes the app feel finished.

- **Key views to cover:** Admin dashboard, Educator dashboard, Learners list, Classes list, Session reports list, Finance dashboard, Organisation learners, Inventory list.
- **Pattern:** In data hooks or components, expose `isLoading`, `isError`, `data` (or equivalent). Then:
  - **Loading:** Show skeleton or spinner (you have `Skeleton` in shadcn; use it for cards/tables).
  - **Empty:** Friendly message (e.g. "No sessions today", "No learners match your filters").
  - **Error:** Simple banner with "Something went wrong" and a "Try again" button (or retry callback).
- This will make swapping mock → API a matter of changing the data source in the hook; the UI stays the same.

---

## 3. Confirmations for destructive actions

Use shadcn **AlertDialog** before any action that removes or deletes data. You already use it in some places (e.g. session report reminder, some inventory flows). Extend to:

- Deleting or removing **availability blocks** (educator schedule).
- **Removing a coach** from a session.
- **Returning a device** (inventory).
- **Dropping a learner** from a class (class enrolments).
- Any **delete** or **remove** in admin/finance (e.g. expense, enrolment).

Confirm with a short message and **Cancel** / **Confirm**; run the action only after confirm.

---

## 4. Educator MVP hardening (in order)

These are from `EDUCATOR_MVP_HARDENING_CHECKLIST.md`. Doing them before backend keeps educator flows consistent and avoids rework.

1. **Add coach on sessions** – SessionsContext (or existing) with `updateSession`; "Add coach" / "Manage coaches" in class detail and session header; chips for coaches with remove; `getSessionRoleForUser(session, user)` → `"facilitator"` | `"coach"` | `"none"`.
2. **Coach feedback on session report** – Extend SessionReport type with `coachFeedback`; coaches can add feedback on report page; show only to admin/facilitator/author.
3. **Schedule visibility** – Admin `/admin/schedules` and educator team schedule: educator/week selectors, read-only calendar with sessions and availability.
4. **Full lesson plan editor** – All pedagogy fields (objectives, blocks, materials, etc.) in `LessonPlanInstance` and in the lesson plan form with sections (Draft / Ready).
5. **Quick notes / reminders** – EducatorNotesContext; notes icon on dashboard session cards; optional "Today's notes" on dashboard.
6. **Educator badges (computed)** – `computeEducatorBadges(educatorId, sessions)` from facilitator sessions/tracks/hours; show on Educator profile and "Your badges" on dashboard.
7. **Hours by term** – `isInCurrentTerm` / `isInCurrentYear`; period selector on Educator profile; dashboard summary default to "This term."
8. **Permission checks for coaches** – Use `getSessionRoleForUser` on Attendance and Expenses pages: facilitator = full edit, coach = read-only or message "Only the facilitator can edit…".
9. **"Add coach" from class detail** – Coaches column in class sessions table; "Add coach" / "Manage" for facilitator/admin; wire to `updateSession`.

Items 2–4 and 6–9 depend on 1 (coach on sessions and role helper). Do 1 first, then 2–4, then 5–9 as needed.

---

## 5. Admin and finance UX

| Area | Improvement |
|------|-------------|
| **Dashboard** | Clear "pending" summary: e.g. "5 session reports missing", "3 account approvals", with quick links to the right pages. |
| **Staff profile** | Richer view: assigned classes, sessions this term, hours summary. |
| **Account approvals** | Approve/reject buttons with confirmation and success feedback; optional bulk approve. |
| **Session reports** | "Send reminder" is toast-only; leave a placeholder or comment for "wire to email/API when backend ready." Coach feedback on report detail when that feature exists. |
| **Finance** | Single finance "home" or dashboard section linking to educator payments, expenses, session expenses, invoices. Income categorisation (session type, org, programme, payer) for reporting. |
| **Breadcrumbs** | Optional breadcrumbs on deep pages (e.g. Learners → [Name], Classes → [Class] → Enrolments) for easier navigation. |

---

## 6. Performance and architecture (per .cursor rules)

| Item | What to do |
|------|------------|
| **Route code-splitting** | Use React `lazy()` and `Suspense` for route-level components. Split admin, educator, finance, parent, organisation, student into separate chunks so the initial bundle is smaller. |
| **Heavy components** | Lazy-load charts, large tables, report modals, and rich editors only when the user opens those screens. |
| **State and data** | Keep using context for auth and domain state; when you add API, use the same hooks and add `isLoading`/`isError`/retry so UI stays consistent. |

---

## 7. Role and permission clarity

- **Inventory:** Educators can only **view** and **check out**; admin has full CRUD. Enforce in UI (hide/disable Add, Edit, Delete for educators) and document for backend enforcement.
- **Coach vs facilitator:** Everywhere a session action is shown (attendance, expenses, report), use `getSessionRoleForUser` to show edit vs read-only.
- **Organisation:** Already scoped by `organizationId`; ensure every org page uses the same pattern (e.g. `useOrganisationLearners` or equivalent).

---

## 8. Consistency and polish

- **Empty lists:** Same pattern everywhere: icon or illustration + short message + optional primary action (e.g. "Add first learner").
- **Forms:** Consistent validation messages and primary button labels (Save / Submit / Request).
- **Tables:** Consistent use of filters, search, and "No results" state.
- **Docs:** Keep `ADMIN_FLOW_MVP.md`, `ORGANISATION_FLOW_MVP.md`, `EDUCATOR_FLOW_MVP.md`, `LEARNER_FLOW_MVP.md` updated as you ship changes.

---

## Suggested order before backend

1. **Quick wins** (term selector on admin learner, inventory checkout text, educator sidebar + dashboard line, document title).
2. **Loading/empty/error** on 3–5 key pages (e.g. admin dashboard, educator dashboard, learners list) so the pattern is in place.
3. **Confirmations** for any destructive action that doesn’t have one yet.
4. **Educator hardening** starting with "Add coach" and `getSessionRoleForUser`, then coach feedback, schedule visibility, lesson plan editor, notes, badges, hours by term, coach read-only.
5. **Admin/finance polish** (pending summary, staff profile, account approvals, breadcrumbs).
6. **Route lazy-loading** and lazy heavy components.

After that, the frontend will be in good shape to swap mock data for API calls with minimal UI change.

---

## Implementation status (last updated)

- **Quick wins:** Done — document title (CWK Hub), admin learner term selector, inventory checkout text (with due date), educator dashboard line already present; educator nav already streamlined.
- **Loading/empty/error:** Done — admin dashboard and educator dashboard show skeletons briefly and have error banner + retry; learners list has error banner and improved empty-state copy.
- **Confirmations:** Done — availability block remove, coach remove, return device already had AlertDialogs; added confirmation for “Mark as dropped” on class enrolments.
- **Admin polish:** Done — “Pending actions” summary on admin dashboard (session reports missing count + account approvals count with links).
- **Route lazy-loading:** Done — Admin, Finance, and Educator dashboard routes are lazy-loaded; `Suspense` with “Loading…” fallback wraps `Routes`.
- **Educator hardening:** Coach on sessions and `getSessionRoleForUser` already implemented; coach feedback, full lesson plan editor, notes, computed badges, hours by term, and breadcrumbs remain as optional/future work.
