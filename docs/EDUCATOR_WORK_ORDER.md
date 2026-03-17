# Educator work order

Suggested order to work on educator features. Use this to prioritise and track progress.

---

## Quick impact

- [x] **Wire educator dashboard to real sessions (and terms) when API is on**
  - Done: Dashboard uses `sessionsGetAll({ educatorId })` and `useTerms()` when `VITE_API_URL` is set. Today/upcoming/past sessions, hours summary, badges, and My classes (with `getSessionsForClassResolved`) use API data.
- [ ] **Add loading / empty / error on dashboard and class detail**
  - Dashboard: has skeleton when loading; could add explicit empty states (e.g. “No sessions today”) and error banner with “Try again” when queries fail.
  - Class detail: add loading skeleton, empty state when no class/sessions, and error handling with retry.

---

## Then

- [ ] **Add/remove coach (UI + persistence)**
  - SessionsContext has `updateSession` (mock only). Add backend PATCH for session `assistantEducatorIds` (or equivalent).
  - UI: “Add coach” button (facilitator or admin) on Class detail and session headers; dialog to pick educator; chips for existing coaches with “Remove”.
  - See `EDUCATOR_MVP_HARDENING_CHECKLIST.md` §1 and §12.
- [ ] **Coach feedback on report (save + visibility)**
  - Ensure coach can add/edit feedback and it’s saved (SessionReportsContext/API). Visibility: admin, facilitator, and that coach only.
  - See `EDUCATOR_MVP_HARDENING_CHECKLIST.md` §2.
- [ ] **Coach read-only on attendance/expenses**
  - Use `getSessionRoleForUser(session, user)`. If role is coach: show read-only view or message “Only the facilitator can edit attendance/expenses.”
  - See `EDUCATOR_MVP_HARDENING_CHECKLIST.md` §11.

---

## Then

- [ ] **Schedule visibility for admin (and optional team)**
  - Admin “Schedules” page (e.g. `/admin/schedules`) with educator filter and read-only week view.
  - Educator “Team schedule” already exists; ensure it uses API sessions/educators when API is on (partially done).
- [ ] **Lesson plan editor fields and persistence**
  - Full editor fields (objectives, blocks, materials, differentiation, assessment, etc.) and persist via API if backend exists.
  - See `EDUCATOR_MVP_HARDENING_CHECKLIST.md` §4.
- [ ] **Hours by term on profile and badges from real data**
  - Educator profile: period selector (“This term” / “This year” / “All time”) and recompute facilitating/coaching hours for selected period.
  - Badges: ensure computed from real session data when API is on (dashboard already uses API sessions for badges).

---

## Ongoing

- [ ] **Replace remaining mock with API when endpoints exist**
  - Coaching invites: real API for list and accept/decline.
  - Tasks: real API for L&D-assigned tasks.
  - Team schedule: already uses API sessions/educators when on; replace any remaining `mockUsers`/`getClass` fallbacks with API-backed lookups where available.
  - For **labels/display** (payer, learner, class, educator names): use by-id hooks and cell components so hooks are not called in loops. See `MOCK_DATA_STRATEGY.md` §3.

---

## References

- `MOCK_DATA_STRATEGY.md` – always mock vs mock-when-API-off vs labels; get-one replacement pattern.
- `EDUCATOR_FLOW_MVP.md` – spec
- `EDUCATOR_MVP_IMPLEMENTATION_PLAN.md` – phases and data model
- `EDUCATOR_MVP_HARDENING_CHECKLIST.md` – detailed implementation notes for Add coach, Coach feedback, permissions, etc.
