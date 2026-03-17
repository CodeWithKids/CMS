# Mock data strategy

This doc maps where mock data is used and how to reduce reliance on it. Use it to prioritise API work and to fix “labels/display” usage so we don’t call get-one helpers inside loops (which breaks React’s rules of hooks and can cause crashes).

---

## 1. Always mock (no API yet)

These areas have **no backend API**; the app uses mock data or in-memory context only.

| Area | Where | Notes |
|------|--------|------|
| **Schedule (availability slots)** | `mockData/educator.ts` → `getAvailabilitySlotsForEducator`, `ScheduleContext` | Educator weekly availability; no API. |
| **Enrollments** | `EnrollmentsContext`, `mockClassEnrollments`, `getEnrollmentsForClass`, `getLearnersForClassAndTerm` | Class/term enrollments; no API. |
| **Event registrations** | `EventRegistrationsContext`, `mockEventRegistrations`, events feature | Event list may use `mocks/eventsApi`; registrations are mock. |
| **Coaching invites** | `CoachingInvitesContext`, `mockCoachingInvites` | L&D creates; educator accepts/declines; no API. |
| **Session expenses** | `SessionExpensesContext`, `mockEducatorSessionExpenses` | Educator claims; finance approves; no API. |
| **Lesson plans** | `LessonPlansContext`, `mockLessonPlanTemplates`, `mockLessonPlanInstances` | Templates and per-session instances; no API. |
| **Coaching notes** | `EducatorNotesContext` (in-memory) | Notes per session/date; no API. |
| **Finance account context** | `FinanceAccountContext`, `mockData/financeAccount` | Single source for invoices/expenses when API off; when API on, Finance (invoices) uses `FinanceContext` + API. |

**“Get one” helpers (mock only, used for labels/display):**  
`getClass`, `getLearner`, `getOrganization`, `getEducatorName`, `getCurrentTerm`, `getTerm`, `getLearnersForClass`, `getLearnerForOrganisation`, etc. live in `mockData/index.ts`. When the API is enabled, **do not call these inside `.map()` or `useMemo`** — use the hooks below and render **cell components** so hooks run at top level. See §3 and [Get-one helper replacement](#get-one-helper-replacement) below.

---

## 2. Mock when API disabled

When `VITE_API_URL` is not set (or API is off), these use mock or context data; when set, they use the API.

| Area | Hook / context | Mock source |
|------|----------------|------------|
| **Terms** | `useTerms()` | `mockTerms`, `getCurrentTerm` |
| **Learners** | `useLearners()` | `mockLearners` |
| **Educators** | `useEducators()` | `mockUsers` (role educator) |
| **Classes** | `classesGetAll()` + cache / `useEducators` | `mockClasses` |
| **Sessions** | `sessionsGetAll()` + cache | `mockSessions` |
| **Finance (invoices)** | `FinanceContext` + `useInvoices()` | `FinanceAccountContext` / mock |
| **Organisations** | `organisationsGetById`, `useOrganisation(id)` | `mockOrganizations`, `getOrganization` |
| **Admin / parent / student pages** | Various | Same as above where they depend on terms, learners, classes, sessions |

---

## 3. Mock used for labels/display even with API on

Invoice, report, and session/class pages often show **names** (payer, learner, organisation, class, educator). If that name comes from a **get-one helper** called inside a loop or `useMemo`, it:

- Violates React’s rules of hooks if the helper ever uses a hook (e.g. `useOrganisation`).
- Can cause “Cannot read properties of undefined (reading 'length')” or similar when hook order is broken.

**Safe pattern:** use **by-id hooks** and **cell components** so each row/item renders a component that calls the hook once at the top level.

| Display | Prefer | Avoid |
|--------|--------|--------|
| Organisation name | `useOrganisation(id)` inside `<OrgNameCell orgId={id} />` | `getOrganization(id)` or `getOrgName(id)` inside `.map()` / `useMemo` |
| Learner name | `useLearner(id)` inside `<LearnerNameCell learnerId={id} />` | `getLearner(id)` inside `.map()` / `useMemo` |
| Class name | `useClass(id)` inside `<ClassNameCell classId={id} />` | `getClass(id)` inside `.map()` / `useMemo` |
| Educator name | `useEducator(id)` inside `<EducatorNameCell educatorId={id} />` | `getEducatorName(id)` inside `.map()` / `useMemo` |

**Where this applies:**

- **Invoice / report pages:** Payer (org or learner), learner names. Example: `IncomePage` uses `OrgNameCell` + `PayerCell`; do the same for `InvoiceListPage`, `FinanceReportsPage`, `InvoiceDetailPage`, etc. for learner/org columns.
- **Session / class pages:** Class name, educator name. Use `ClassNameCell` / `EducatorNameCell` (or lookup from `useEducators()` / `classesGetAll()` when you already have the list) so hooks are not called in a loop.

---

## Get-one helper replacement

1. **By-id hooks** (API when enabled, mock when disabled):
   - `useOrganisation(id)` — already exists.
   - `useLearner(id)` — returns `{ learner, isLoading }`; display name = `firstName + lastName`.
   - `useClass(id)` — returns `{ class: ClassApi | null, isLoading }`; display name = `class.name`.
   - `useEducator(id)` — returns `{ educator, isLoading }`; display name = `educator.name`.

2. **Cell components:**  
   One component per “entity label” that takes an id, calls the corresponding hook once, and renders the name (or id fallback). Use these in table cells and lists instead of calling a get-one helper inside `.map()` or `useMemo`.

3. **Income page:**  
   Already refactored: `OrgNameCell`, `PayerCell`; no `getOrgName` in loops. Apply the same pattern elsewhere that uses `getLearner`, `getOrganization`, `getClass`, or `getEducatorName` in lists.

---

## References

- `EDUCATOR_WORK_ORDER.md` — educator feature order; “Replace remaining mock with API” ties to §1.
- `src/mockData/index.ts` — get-one helpers and mock lists.
- **By-id hooks:** `useOrganisation`, `useLearner`, `useClass`, `useEducator` in `src/hooks/`.
- **Cell components:** `src/components/EntityNameCells.tsx` — `LearnerNameCell`, `ClassNameCell`, `EducatorNameCell`. For org names use `OrgNameCell` (e.g. in `IncomePage`) or a similar component using `useOrganisation`.
- `src/pages/finance/IncomePage.tsx` — `OrgNameCell` / `PayerCell` pattern (no get-one in loops).
