# Educator MVP – Implementation Plan

This plan maps the [EDUCATOR_FLOW_MVP.md](./EDUCATOR_FLOW_MVP.md) spec to the current codebase and breaks work into phases. Types and mock data use existing names where they already align (e.g. `Session.leadEducatorId` / `assistantEducatorIds` map to facilitator/coach).

---

## Current state vs spec

| Spec area | Current state | Gap |
|-----------|----------------|-----|
| Login → dashboard | ✅ Exists | None |
| My Schedule / Calendar | ❌ Missing | New route `/educator/schedule`, week view, blocks, coaching assignment |
| Devices (checkout/return) | ⚠️ Inventory exists, no checkout | Add checkout/return, “My devices”, assignee + dates on items |
| Dashboard (teaching cockpit) | ⚠️ Basic today/past/classes | Add role badges, track, device indicator, status chips (lesson plan, attendance, report, expenses), upcoming, hours summary, My devices |
| Class detail | ⚠️ Exists | Add role per session, lesson plan status, link to lesson plan |
| Lesson plans | ❌ Missing | New route, library (templates by track), session plan entity, states (Not started/Draft/Ready), facilitator/coach permissions |
| Attendance / Report / Expenses | ✅ Exist | Add facilitator/coach chips on session page; optional coach feedback section |
| Educator profile | ❌ Missing | New route, basic info, sessions/hours/tracks/badges |

---

## Phase 1 – Data model & schedule

**Goal:** Support facilitator/coach, schedule blocks, and device checkout without changing UX yet.

1. **Types**
   - Ensure `Session` supports facilitator + coaches (already has `leadEducatorId`, `assistantEducatorIds`; align naming with spec if desired: facilitatorId vs leadEducatorId, coachIds vs assistantEducatorIds).
   - Add `EducatorScheduleBlock` (or similar): educatorId, date, startTime, endTime, type (facilitating | coaching | unavailable), optional sessionId / classId / label.
   - Add `LessonPlan` (template): id, learningTrack, level/unit, title, content (or structured fields), optional week number.
   - Add `SessionLessonPlan`: sessionId, templateId (optional), state (not_started | draft | ready), copied content (editable), optional coachNotes.
   - Extend `InventoryItem` (or device type): checkedOutTo (educatorId), checkedOutAt, dueDate; or add a separate `DeviceCheckout` entity.

2. **Mock data & context**
   - Add mock schedule blocks for the current educator (e.g. next 2 weeks).
   - Add mock lesson plan templates (e.g. 2–3 per track).
   - Add mock session lesson plans (some draft, some ready) for existing sessions.
   - Add checkout state to mock inventory (e.g. 1–2 items checked out to educator u2).
   - Add `ScheduleContext` (or extend a shared context) for schedule blocks (CRUD).
   - Add `LessonPlansContext` (templates + session plans): get templates by track, get plan for session, save session plan, set state.
   - Extend `InventoryContext` (or add checkout context): checkout(itemId, educatorId), return(itemId), getCheckedOutTo(educatorId).

3. **Route: My Schedule** (`/educator/schedule`)
   - Week view (Mon–Sun vs time).
   - Render existing sessions (from classes) for this educator (facilitator + coach) from mock sessions.
   - Render schedule blocks (availability, facilitating, coaching) from context.
   - Allow add/edit/delete blocks for upcoming week (simple form or inline).
   - “Add coach” on a session: modal to pick educator, then update session’s coach list (mock only); coach’s schedule shows that session as coaching.
   - Optional: read-only “View all” for admin/finance (filter by educator or show all).

---

## Phase 2 – Dashboard & class detail enhancements

**Goal:** Dashboard and class detail match the “teaching cockpit” and class session table in the spec.

4. **Educator dashboard** (`/educator/dashboard`)
   - **Today’s sessions**: only sessions where current user is facilitator or coach. Per card: time, class, location, **role badge** (Facilitator / Coach), **learning track**, **device indicator** (e.g. “Laptop 2” if they have a device checked out), **status chips** (Lesson plan: Pending/Draft/Ready, Attendance: Pending/Done, Report: Pending/Submitted, Expenses: Pending/Logged), quick buttons: Lesson plan, Attendance, Report, Expenses.
   - **Upcoming sessions**: same structure, future dates (e.g. next 7 days).
   - **Past sessions**: keep current behaviour; add completion status from session plan/report/attendance/expenses.
   - **My classes**: add learning tracks per class (from sessions for that class).
   - **Hours & activity**: “This week” / “This term” – hours facilitating (sessions where leadEducatorId = me), hours coaching (sessions where I’m in assistantEducatorIds), session count, class count (from existing data).
   - **My devices**: list of inventory items currently checked out to current educator (from Inventory/checkout context).
   - Optional: **Notes/reminders** – simple list or per-session note (new small entity or keyed by date/sessionId in context).

5. **Class detail** (`/educator/classes/:id`)
   - Sessions table: add column **Role** (Facilitator / Coach) for current educator per session.
   - Add **Lesson plan** status and link to `/educator/sessions/:id/lesson-plan`.
   - Keep existing Attendance / Report / Expenses links; add Lesson plan link.
   - Status chips per row: Lesson plan, Attendance, Report, Expenses (reuse same logic as dashboard).

---

## Phase 3 – Lesson plans

**Goal:** Educators can pick a track-based template and edit a session-specific plan.

6. **Lesson Plan Library (templates)**
   - Data: already in mock (Phase 1). UI: either a dedicated admin/library page or only surfaced inside the session lesson-plan flow.
   - For session lesson plan page: filter templates by session’s `learningTrack` (and optionally level/unit if added).

7. **Session lesson plan page** (`/educator/sessions/:id/lesson-plan`)
   - Resolve session (and learning track). If no session plan: show template picker (filtered by track); on “Use this plan”, create SessionLessonPlan from template (copy content), redirect or stay and show editor.
   - Editor: all fields from spec (metadata, objectives, prior knowledge, materials & setup, lesson structure timed blocks, differentiation, assessment, homework). Use form + local state then save to LessonPlansContext.
   - State: Not started / Draft / Ready (dropdown or buttons); persist with session plan.
   - Permissions: facilitator can edit; coach read-only + optional coach notes section (stored separately, visible to admin/lead); admin can view all (read-only in MVP).
   - Dashboard/class detail already show lesson plan status from Phase 2.

8. **Session pages (attendance, report, expenses)**
   - Add a short header or chips: “Facilitator: Jane”, “Coach: John” (from session.leadEducatorId, session.assistantEducatorIds).
   - Optional: on report page, if current user is coach, show “Coach feedback” text area (save to report or separate coach-note entity); visible only to admin (and optionally lead educator).

---

## Phase 4 – Educator profile & badges

**Goal:** One place to see an educator’s activity and track mastery.

9. **Educator profile** (`/educator/profile` or `/educator/me`)
   - Basic info: name, avatar, main location (from user or first class), roles (Educator, Coach – infer from having led or assisted sessions).
   - Sessions history: total count; breakdown “As facilitator” / “As coach”; filterable list (date, class, location, role, learning track).
   - Hours taught: total facilitating hours, total coaching hours (from sessions + durationHours); optional by term/year.
   - Learning tracks facilitated: per track, count of sessions and hours (facilitator only).
   - Educator badges: define 2–3 mock badges (e.g. “Python Master” – e.g. ≥10 sessions in python track); store “earned” in mock (e.g. EducatorBadgeAward: educatorId, badgeId, earnedAt); show on profile with date and short criteria; optional dashboard widget “You are a Python Master educator”.
   - Sidebar: add “Profile” under educator nav.

10. **Badge rules (mock)**
    - Implement simple rules in a helper (e.g. getEducatorBadges(educatorId): check sessions per track, return list of badge IDs earned). Call from profile (and dashboard if showing badge widget).

---

## Phase 5 – Polish & visibility

**Goal:** Calendars visible to admin/finance/other educators; device checkout clear in inventory.

11. **Schedule visibility**
    - Admin/finance: “Schedules” or “Calendars” page (or under existing menu): week view, educator selector or “All”, read-only. Shows same blocks + sessions as educator view.
    - Educators: optional “Team schedules” read-only view (or same page with role check).

12. **Inventory UX**
    - List: show status (Available / Checked out), if checked out show “Educator name, since date”.
    - Detail: **Check out** (if available) → set checkedOutTo, checkedOutAt, optional dueDate; **Return** (if checked out to me) → clear.
    - “My devices” on dashboard already in Phase 2; ensure inventory list filters or highlights “Checked out to me”.

13. **Navigation**
    - Educator sidebar: add **Schedule** (`/educator/schedule`), **Profile** (`/educator/profile`). Order: Dashboard, Schedule, My classes (or keep classes only on dashboard), Profile, Earnings, Inventory.

---

## Suggested implementation order

1. **Phase 1** – Types, mock data, Schedule context, Inventory checkout, Lesson plan templates + SessionLessonPlan context; then **Schedule page** and **Checkout/return** on inventory detail.
2. **Phase 2** – Dashboard and class detail enhancements (role badges, status chips, hours, My devices, lesson plan link).
3. **Phase 3** – Session lesson plan page (template picker + editor), facilitator/coach chips and coach feedback on session pages.
4. **Phase 4** – Educator profile page, hours/tracks/badges, badge rules.
5. **Phase 5** – Schedule visibility for admin/finance/team, inventory list/detail polish.

---

## Files to add or touch (reference)

| Area | New files | Existing files to change |
|------|-----------|---------------------------|
| Types | – | `src/types/index.ts` (schedule block, lesson plan, session plan, checkout fields) |
| Schedule | `src/context/ScheduleContext.tsx`, `src/pages/educator/EducatorSchedulePage.tsx` | `src/App.tsx` (route), `src/components/layout/AppLayout.tsx` (nav), `src/mockData/index.ts` |
| Lesson plans | `src/context/LessonPlansContext.tsx`, `src/pages/educator/SessionLessonPlanPage.tsx`, template picker component | `src/App.tsx`, nav, mockData |
| Inventory checkout | – | `src/types/index.ts`, `src/context/InventoryContext.tsx`, `src/mockData/index.ts`, `src/pages/inventory/InventoryDetailPage.tsx` |
| Dashboard | – | `src/pages/educator/EducatorDashboard.tsx` |
| Class detail | – | `src/pages/educator/ClassDetailPage.tsx` |
| Educator profile | `src/pages/educator/EducatorProfilePage.tsx` | `src/App.tsx`, nav, mockData (badges, rules) |
| Session pages | – | `src/pages/educator/AttendancePage.tsx`, `SessionReportPage.tsx`, `SessionExpensePage.tsx` (chips, coach feedback) |

---

## Notes

- **Session identity:** Spec uses “facilitator” and “coach”. Codebase has `Session.leadEducatorId` and `Session.assistantEducatorIds`; treat lead = facilitator, assistant = coach. No type rename required for MVP if product is fine with existing names.
- **Lazy loading:** When adding new educator routes (schedule, lesson plan, profile), use `React.lazy` + `Suspense` to keep the educator bundle split and align with CWK Hub performance rules.
- **Backend:** All of the above can be implemented with mock data and context; when the API exists, replace contexts with API clients + React Query and keep the same UI structure.
