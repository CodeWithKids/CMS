# CWK Hub – API contracts (auth, learners, classes, sessions, finance, organisations)

This document defines the **API contracts** for the domains that power most frontend flows. Response/request shapes align with existing frontend types where possible.

**Base URL:** `https://api.codewithkids.co.ke` (or `/api` when same-origin).  
**Version prefix:** `/v1` (e.g. `/v1/auth/me`).  
**Auth:** All protected endpoints expect `Authorization: Bearer <access_token>` (or session cookie if using cookie-based auth).

---

## 1. Common conventions

### Response envelope (optional)

- **Success:** Return the resource or array directly (no wrapper), or a consistent wrapper if you prefer:
  ```json
  { "data": { ... } }
  ```
- **List responses:** Pagination when needed:
  ```json
  { "items": [...], "nextCursor": "optional", "total": 123 }
  ```
  For MVP, returning a plain array `[...]` is acceptable.

### Errors

- **HTTP status:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `422` (business rule), `500` (server error).
- **Body (JSON):**
  ```json
  {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { "field": ["error1"] }
  }
  ```

### Auth context

- After login, the backend issues an **access token** (and optionally refresh token). The frontend sends the access token on every request.
- The backend resolves the **current user** (id, role, organisationId) from the token and uses it for authorization and filtering.

---

## 2. Auth

### POST `/v1/auth/login`

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```
(Or `provider`, `idToken` for OAuth when supported.)

**Response (200):**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600,
  "user": {
    "id": "string",
    "name": "string",
    "role": "admin | educator | finance | student | parent | organisation | partnerships | marketing | social_media | ld_manager",
    "email": "string",
    "status": "pending | active | rejected",
    "organizationId": "string | null",
    "membershipStatus": "active | inactive | expired",
    "avatarId": "string | null"
  }
}
```
`user` matches frontend `AppUser`. For **students**: only allow login if linked learner has `programType === "MAKERSPACE"` and `membershipStatus === "active"`. For **parents**: only if `membershipStatus === "active"`. Return `401` with a clear message otherwise.

---

### GET `/v1/auth/me`

**Response (200):** Same `user` object as in login response.  
**401:** Not authenticated.

---

### POST `/v1/auth/logout`

**Request:** Optional body `{ "refreshToken": "string" }`.  
**Response (204):** No body. Invalidates refresh token if provided.

---

## 3. Learners

### GET `/v1/learners`

**Query:** `search?`, `enrolmentType?` (member | partner_org), `organisationId?`, `status?` (active | alumni).  
**Response (200):** Array of `Learner`:
```json
[
  {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "dateOfBirth": "string",
    "school": "string",
    "enrolmentType": "member | partner_org",
    "programType": "MAKERSPACE | SCHOOL_CLUB | ORGANISATION",
    "membershipStatus": "active | inactive | expired | null",
    "userId": "string | null",
    "parentName": "string",
    "parentPhone": "string",
    "parentEmail": "string",
    "organizationId": "string | null",
    "status": "active | alumni",
    "gender": "male | female | other | null",
    "joinedAt": "string | null"
  }
]
```
**Authorization:** Admin (all); Organisation role restricted to `organisationId` matching their org.

---

### GET `/v1/learners/:id`

**Response (200):** Single `Learner` or admin profile shape (e.g. `LearnerAdminProfile`) if you have an extended admin view.  
**404:** Learner not found or not allowed for this role.

---

## 4. Classes and enrolments

### GET `/v1/classes`

**Query:** `termId?`, `program?`, `educatorId?`.  
**Response (200):** Array of `ClassEntity`:
```json
[
  {
    "id": "string",
    "name": "string",
    "program": "string",
    "ageGroup": "string",
    "location": "string",
    "educatorId": "string",
    "termId": "string",
    "learnerIds": ["string"],
    "capacity": "number | null"
  }
]
```

---

### GET `/v1/classes/:id`

**Response (200):** Single `ClassEntity`.  
**404:** Class not found.

---

### GET `/v1/classes/:id/enrolments`

**Query:** `termId` (required).  
**Response (200):** Array of enrolments:
```json
[
  {
    "id": "string",
    "classId": "string",
    "learnerId": "string",
    "termId": "string",
    "status": "active | dropped | completed"
  }
]
```

---

### POST `/v1/classes/:id/enrolments`

**Request:**
```json
{
  "learnerId": "string",
  "termId": "string",
  "status": "active"
}
```
**Response (201):** Created enrolment object.  
**400/422:** Validation or business rule (e.g. class full, duplicate).

---

### PATCH `/v1/enrolments/:id`

**Request:** `{ "status": "active | dropped | completed" }`.  
**Response (200):** Updated enrolment.

---

## 5. Sessions

### GET `/v1/sessions`

**Query:** `educatorId?`, `learnerId?`, `classId?`, `dateFrom?`, `dateTo?`, `termId?`.  
**Response (200):** Array of `Session`:
```json
[
  {
    "id": "string",
    "classId": "string",
    "date": "YYYY-MM-DD",
    "startTime": "string",
    "endTime": "string",
    "topic": "string",
    "sessionType": "makerspace | school_stem_club | virtual | home | organization | miradi",
    "durationHours": "number",
    "learningTrack": "string",
    "termId": "string",
    "leadEducatorId": "string",
    "assistantEducatorIds": ["string"]
  }
]
```
**Authorization:** Admin sees all; Educator sees own (lead or assistant); Student sees sessions for their enrolments; Organisation not needed for sessions list (they use learners/invoices).

---

### GET `/v1/sessions/:id`

**Response (200):** Single `Session`.  
**404:** Session not found or not allowed.

---

## 6. Finance – Invoices

### GET `/v1/finance/invoices`

**Query:** `termId?`, `status?`, `payerType?` (parent | organisation), `organisationId?`, `learnerId?`.  
**Response (200):** Array of `FinanceInvoice` (see `@/types/finance`):
```json
[
  {
    "id": "string",
    "payerType": "parent | organisation",
    "payerId": "string",
    "learnerId": "string | null",
    "organisationId": "string | null",
    "termId": "string",
    "grossAmount": "number",
    "discountAmount": "number",
    "netAmount": "number",
    "amountPaid": "number",
    "balance": "number",
    "currency": "string",
    "dueDate": "string",
    "issueDate": "string",
    "status": "draft | issued | partially_paid | paid | overdue | cancelled"
  }
]
```
**Authorization:** Finance + Admin: full list. Parent: only invoices for their linked learners. Organisation: only invoices for their `organisationId`.

---

### GET `/v1/finance/invoices/:id`

**Response (200):** Single `FinanceInvoice`.  
**403/404:** Not allowed or not found.

---

## 7. Finance – Payments

### GET `/v1/finance/invoices/:id/payments`

**Response (200):** Array of `Payment`:
```json
[
  {
    "id": "string",
    "invoiceId": "string",
    "amount": "number",
    "method": "mpesa | bank_transfer | cash | card | other",
    "reference": "string | null",
    "date": "string",
    "recordedBy": "string",
    "createdAt": "string"
  }
]
```

---

### POST `/v1/finance/invoices/:id/payments`

**Request:**
```json
{
  "amount": "number",
  "method": "mpesa | bank_transfer | cash | card | other",
  "reference": "string | null",
  "date": "YYYY-MM-DD",
  "recordedBy": "string"
}
```
**Response (201):** Created `Payment`.  
**400/422:** Amount &gt; balance, invalid date, etc.

---

## 8. Finance – Adjustments (discounts / refunds)

### GET `/v1/finance/invoices/:id/adjustments`

**Response (200):** Array of `AdjustmentRequest` (see `@/types/finance`).

---

### POST `/v1/finance/invoices/:id/adjustments`

**Request (discount):**
```json
{
  "type": "discount",
  "reason": "string",
  "discountScope": "this_invoice | this_term | ongoing",
  "discountPercent": "number | null",
  "discountAmount": "number | null",
  "requestedBy": "string"
}
```
**Request (refund):**
```json
{
  "type": "refund",
  "reason": "string",
  "refundAmount": "number",
  "refundApplication": "refund_to_payer | credit_for_future",
  "requestedBy": "string"
}
```
**Response (201):** Created adjustment.  
**400/422:** Validation or policy (e.g. refund &gt; net, discount % &gt; 100).

---

## 9. Finance – Educator session expenses

### GET `/v1/finance/session-expenses`

**Query:** `educatorId?`, `sessionId?`, `status?`.  
**Response (200):** Array of `EducatorSessionExpense`:
```json
[
  {
    "id": "string",
    "educatorId": "string",
    "sessionId": "string",
    "schoolName": "string",
    "transportTo": "number",
    "transportFrom": "number",
    "otherAmount": "number",
    "totalRequested": "number",
    "status": "requested | issued | paid",
    "requestedAt": "string",
    "issuedAt": "string | null",
    "paidAt": "string | null",
    "processedBy": "string | null",
    "notes": "string | null"
  }
]
```
**Authorization:** Educator sees own; Finance/Admin see all.

---

### POST `/v1/finance/session-expenses`

**Request:**
```json
{
  "educatorId": "string",
  "sessionId": "string",
  "schoolName": "string",
  "transportTo": "number",
  "transportFrom": "number",
  "otherAmount": "number",
  "totalRequested": "number",
  "status": "requested",
  "requestedAt": "string",
  "notes": "string | null"
}
```
**Response (201):** Created `EducatorSessionExpense`.  
**403:** Only educator (or system) can create for themselves.

---

### PATCH `/v1/finance/session-expenses/:id`

**Request:** Partial update (e.g. `status`, `issuedAt`, `paidAt`, `processedBy`, or educator-editable fields when status is still `requested`).  
**Response (200):** Updated expense.

---

## 10. Organisations

### POST `/v1/organisations/signup`

**Request:** (aligns with OrganisationSignUpPage)
```json
{
  "organisationName": "string",
  "type": "school | church | NGO | company | other",
  "contactPerson": "string",
  "contactEmail": "string",
  "contactPhone": "string | null",
  "location": "string | null"
}
```
**Response (201):**
```json
{
  "id": "string",
  "message": "Thank you for registering. We will be in touch."
}
```
Backend creates a pending org (and optionally pending user) and notifies admins.

---

### GET `/v1/organisations/:id`

**Response (200):** Organisation profile (e.g. id, name, type, contactPerson, contactEmail, contactPhone, location, status).  
**403:** Only org users for that `organizationId` or admin.

---

### GET `/v1/organisations/:id/learners`

**Response (200):** Array of `Learner` linked to this organisation (`organizationId` or enrolments in org-owned classes – define scope consistently).

---

### GET `/v1/organisations/:id/invoices`

**Response (200):** Array of invoices where `organisationId === id` (same shape as `GET /v1/finance/invoices` filtered by org).

---

## 11. Optional: Account approvals (admin)

### GET `/v1/admin/accounts`

**Query:** `status=pending`.  
**Response (200):** Array of users (e.g. minimal `AppUser`) with `status: "pending"`.

### PATCH `/v1/admin/accounts/:id`

**Request:** `{ "status": "active | rejected", "role?" : "...", "organizationId?": "..." }`.  
**Response (200):** Updated user.

---

## 12. Terms (reference data)

Used by finance, admin, educator, and LD flows for filtering (invoices, classes, sessions, reports).

### GET `/v1/terms`

**Response (200):** Array of terms, e.g.:
```json
[
  { "id": "term-2025-t1", "name": "Term 1 2025", "startDate": "2025-01-15", "endDate": "2025-04-15", "isCurrent": true },
  { "id": "term-2024-t3", "name": "Term 3 2024", "startDate": "2024-09-01", "endDate": "2024-11-30", "isCurrent": false }
]
```

### GET `/v1/terms/current`

**Response (200):** Single term object for the current term (or 404 if none).

---

## 13. Session reports

Educator submits a report per session; admin and LD view list and detail.

### GET `/v1/session-reports`

**Query:** `dateFrom?`, `dateTo?`, `educatorId?`, `program?`, `location?`.  
**Response (200):** Array of session report summaries (e.g. `SessionReportSummary`: id, sessionId, sessionDate, sessionType, organisationName, className, leadEducatorName, presentCount, totalLearners, engagementRating, status).

### GET `/v1/session-reports/:id`

**Response (200):** Full `SessionReport` or `SessionReportDetailView` (includes notes, challenges, stars, badges, incidents, follow-up).  
**404:** Not found.

### GET `/v1/session-reports/by-session/:sessionId`

**Response (200):** Single report for that session, or 404.

### POST `/v1/session-reports`

**Request:** Body matches `SessionReport` (sessionId, leadEducatorId, assistantEducatorIds, date, duration, sessionType, schoolOrOrganizationName, totalLearners, learningTrack, durationHours, femaleCount, maleCount, highlights, objectivesMet, etc.).  
**Response (201):** Created report.

### PATCH `/v1/session-reports/:id`

**Request:** Partial `SessionReport` (e.g. status draft → submitted, or coach feedback).  
**Response (200):** Updated report.

### POST `/v1/session-reports/:id/coach-feedback`

**Request:** `{ "educatorId": "string", "text": "string" }`.  
**Response (200):** Updated report with new coach feedback entry.

---

## 14. Attendance

Educator marks attendance per session; admin/LD/educator views use it.

### GET `/v1/sessions/:id/attendance`

**Response (200):** Array of `AttendanceRecord` (sessionId, learnerId, status, stars?, absenceType?, notes?, markedAt?, markedBy?).

### PUT `/v1/sessions/:id/attendance`

**Request:** Array of `{ learnerId, status, stars?, absenceType?, notes? }`.  
**Response (200):** Full attendance list for the session. Backend may set `markedAt` and `markedBy` from token.

---

## 15. Educators / staff

Admin staff directory, educator profiles, finance educator list, and “get educator name” lookups.

### GET `/v1/educators`

**Query:** `role?` (educator | admin | finance), `status?`.  
**Response (200):** Array of staff/educator profiles (e.g. id, name, email, role, phone?, employmentStatus, hireDate?, contractType?, skills?). Shape can match `StaffMember` or a minimal view.

### GET `/v1/educators/:id`

**Response (200):** Single educator/staff profile (full detail for admin profile page).  
**404:** Not found.

---

## 16. Finance – Adjustments (list and detail)

List all adjustment requests (finance adjustments page); detail for approval workflow.

### GET `/v1/finance/adjustments`

**Query:** `status?`, `invoiceId?`, `termId?`.  
**Response (200):** Array of `AdjustmentRequest` (see §8). Optionally include invoice summary or payer label for list display.

### GET `/v1/finance/adjustments/:id`

**Response (200):** Single `AdjustmentRequest` with invoice context.  
**404:** Not found.

### PATCH `/v1/finance/adjustments/:id`

**Request:** `{ "status": "approved | rejected", "decisionNote?": "string", "approvedBy"?: "string" }`.  
**Response (200):** Updated adjustment.

---

## 17. Finance – Receipts

Parent and organisation invoice detail pages show a receipt when the invoice is paid.

### GET `/v1/finance/invoices/:id/receipt`

**Response (200):** Receipt object (id, invoiceId, invoiceNumber, receiptNumber, paidDate, amountPaid, description?, payerLabel?, createdAt) when the invoice is paid; **404** when not paid or no receipt yet.

---

## 18. Finance – Expenses and income (reporting)

Finance expenses page, income page, and year overview use lists of expenses and income entries.

### GET `/v1/finance/expenses`

**Query:** `dateFrom?`, `dateTo?`, `category?`.  
**Response (200):** Array of expense records (id, amount, date, description?, category?, sessionId?, invoiceId?, etc. – align with frontend `Expense` type).

### GET `/v1/finance/income`

**Query:** `dateFrom?`, `dateTo?`, `sessionType?`, `payerType?`, `organisationId?`.  
**Response (200):** Array of income entries (id, amount, date, description?, sessionType, payerType, organisationId?, invoiceId?) for reporting.

---

## 19. Events (optional for MVP)

Parent and organisation events pages; event registration.

### GET `/v1/events`

**Query:** `from?` (date), `to?`, `target?` (e.g. parent | organisation).  
**Response (200):** Array of events (id, title, date, time, description, target).

### GET `/v1/events/:id/registrations`

**Response (200):** Array of event registrations (learnerId, eventId, status, etc.).

### POST `/v1/events/:id/register`

**Request:** `{ "learnerId": "string" }` (and optionally organisationId or parentId from context).  
**Response (201):** Created registration.

---

## Summary table

| Domain        | Endpoints |
|---------------|-----------|
| Auth          | `POST /v1/auth/login`, `GET /v1/auth/me`, `POST /v1/auth/logout` |
| Terms         | `GET /v1/terms`, `GET /v1/terms/current` |
| Learners      | `GET /v1/learners`, `GET /v1/learners/:id` |
| Classes       | `GET /v1/classes`, `GET /v1/classes/:id`, `GET /v1/classes/:id/enrolments`, `POST /v1/classes/:id/enrolments`, `PATCH /v1/enrolments/:id` |
| Sessions      | `GET /v1/sessions`, `GET /v1/sessions/:id`, `GET|PUT /v1/sessions/:id/attendance` |
| Session reports | `GET /v1/session-reports`, `GET /v1/session-reports/:id`, `GET /v1/session-reports/by-session/:sessionId`, `POST /v1/session-reports`, `PATCH /v1/session-reports/:id`, `POST /v1/session-reports/:id/coach-feedback` |
| Educators     | `GET /v1/educators`, `GET /v1/educators/:id` |
| Finance       | Invoices: `GET /v1/finance/invoices`, `GET /v1/finance/invoices/:id`, `GET /v1/finance/invoices/:id/receipt`. Payments: `GET|POST /v1/finance/invoices/:id/payments`. Adjustments: `GET /v1/finance/adjustments`, `GET /v1/finance/adjustments/:id`, `GET|POST /v1/finance/invoices/:id/adjustments`, `PATCH /v1/finance/adjustments/:id`. Session expenses: `GET|POST|PATCH /v1/finance/session-expenses`. Reporting: `GET /v1/finance/expenses`, `GET /v1/finance/income`. |
| Organisations | `POST /v1/organisations/signup`, `GET /v1/organisations/:id`, `GET /v1/organisations/:id/learners`, `GET /v1/organisations/:id/invoices` |
| Admin         | `GET /v1/admin/accounts`, `PATCH /v1/admin/accounts/:id` |
| Events (opt.) | `GET /v1/events`, `GET /v1/events/:id/registrations`, `POST /v1/events/:id/register` |

---

## Coverage and gaps

**Fully specified (ready for backend):** Auth, Learners, Classes, Enrolments, Sessions, Terms, Session reports, Attendance, Educators, Finance (invoices, payments, adjustments list/detail, session expenses, receipts, expenses, income), Organisations, Admin account approvals. **Events** are specified as optional for MVP.

**Not yet in this contract (can be added when needed):**

- **Partnerships:** Prospects, grants, received donations (CRUD) – currently in frontend stores.
- **Marketing:** Campaigns, brand kit assets – campaign list/create/update and asset URLs.
- **Social media:** Posts, content calendar, analytics – posts list/create/schedule and analytics aggregates.
- **L&D:** Coaching notes per educator, coaching invites, lesson plan library (templates/instances), LD tasks – coaching and lesson-plan endpoints.
- **Inventory:** Items list and CRUD – used by finance inventory page.
- **Educator payments:** List and detail of payments to educators (admin/finance) – e.g. `GET /v1/finance/educator-payments`, `GET /v1/educators/:id/payments`.
- **Programmes / learning tracks:** Reference lists for dropdowns – e.g. `GET /v1/programmes`, `GET /v1/learning-tracks`.
- **Refresh token:** Optional `POST /v1/auth/refresh` with `refreshToken` in body, returning new `accessToken` and optional `expiresIn`.

All request/response bodies use the same field names and types as the frontend where applicable (`AppUser`, `Learner`, `ClassEntity`, `Session`, `SessionReport`, `AttendanceRecord`, `FinanceInvoice`, `Payment`, `AdjustmentRequest`, `EducatorSessionExpense`, `StaffMember`, etc.) so that the existing UI can switch from mocks to API with minimal changes.
