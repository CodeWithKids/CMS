UX & flows per role
Admin / Finance / Educator / Parent / Student / Org / Partnerships / Marketing / Social Media / LD: walk through each primary journey end‑to‑end (e.g. “admin reviewing a session report”, “educator submitting expenses”, “parent paying invoice”) and ensure every screen:
Has clear primary actions, success/error feedback, and no dead ends.
Handles empty states (no data yet) and edge states (partial data, permissions).
Loading, errors, and empty states
Replace generic Loading… with skeletons/spinners per page.
Ensure all list/detail pages show:
Empty states (no learners, no invoices, no campaigns, etc.).
Error states for failed API calls / query errors, with retry actions.
Role‑based navigation & permissions UX
Confirm each role only sees relevant nav items and routes (sides, top nav, breadcrumbs).
Surface “You don’t have access” messages where routes are protected instead of just redirecting silently.
Make sure deep links (e.g. /educator/sessions/:id/report, /finance/invoices/:id) behave correctly for each role.
Visual consistency & branding
Apply the new brand assets and MarketingBrandKitPage styles consistently:
Button variants, typography scale, spacing system, card style.
Consistent table, filter, and modal patterns across modules.
Audit for “odd” legacy components that don’t match the new design and refactor them.
Responsiveness & layout quality
Test every major page at mobile, tablet, and desktop breakpoints.
Fix layout issues: overflowing tables, cramped filters, modals that don’t fit small screens, etc.
Data realism & validation
Replace obviously placeholder/mock data with more realistic mocks or hook into your real APIs where available.
Add form validation and inline error messages for key forms: login, organisation signup, educator reports, expenses, invoices, partnerships, marketing campaigns, etc.
Performance & architecture polish
You already lazy‑load by route, which is great; next:
Lazy‑load especially heavy widgets (charts, big tables) inside dashboards.
Check for unnecessary global context usage and move purely local UI state into components.
Ensure React Query keys and cache behavior are sane for the main data sets.
Observability & QA
Add simple analytics / event tracking hooks for key actions (e.g. session report submitted, invoice approved) if that’s in scope.
Write a small set of critical path tests (even just a few UI tests or unit tests) for:
Auth + role switching
A couple of core flows (e.g. educator marking attendance, finance viewing invoice).

Once you hook up real APIs, we can standardise query keys per domain (["invoices", termId], ["sessionReports", filters], etc.) and enforce consistent stale times and refetch rules.

Implement backend endpoints + data model for auth + finance + educator sessions/expenses first (your most complex flows).
Migrate the frontend contexts to call those APIs (keeping the same shapes where possible so changes are small).
