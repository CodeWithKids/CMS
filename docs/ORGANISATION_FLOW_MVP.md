# CWK Hub Organisation Flow – MVP Spec

This document describes the user flow for **organisations** (schools, churches, NGOs, companies, and partners such as Miradi) in the CWK Hub MVP. Organisation users can sign up, log in, and view only the learners linked to their organisation.

**Operating model: terms.** **Schools** work in **terms**: **Term 1**, **Term 2**, and **Term 3** (three terms per year). Other organisation types (churches, NGOs, Miradi, etc.) may also use the same term structure. Organisations can see **learner progress from every term** — they can view attendance, enrolment, and progress for Term 1, Term 2, or Term 3 (and across years), not only the current term.

**Enrolment per term.** In school coding clubs, learners enrol **per term**. Some learners return for every term; others enrol only for certain terms or leave after one. The system tracks enrolment per term (who was in which class for Term 1, Term 2, Term 3), so organisations can see both "returning" learners and those who were only enrolled in specific terms. The **Enrolment history** section on each learner’s profile shows which terms they were enrolled in and the status (e.g. active, completed, dropped).

---

## 1) Sign up (request portal access)

**Who:** A school or organisation that does not yet have a CWK Hub portal account.

### 1.1 Request access

1. User opens the **Sign up** link from the login page (“Sign up your school or organisation”) or goes directly to **Sign up** (`/signup/organisation`).
2. They see the form: **Sign up your school or organisation** – “Register to get access to view details of your learners (attendance, progress, and more).”
3. They complete:
   - **Organisation name** (e.g. Riverside Academy)
   - **Type**: School, Church, NGO, Company, or Other
   - **Contact person** (full name)
   - **Contact email**
   - **Contact phone** (optional)
   - **Location** (optional, city or address)
4. They click **Request access**.
5. They see a confirmation: **Thank you for registering** – “We’ve received your request. Our team will be in touch to set up your organisation portal so you can view your learners’ details.”
6. They can go **Back to login** (for when their account is ready).

**Note:** In MVP, the form does not create an account automatically; CWK staff set up the organisation and portal access. The same flow applies to **schools**, **churches**, **NGOs**, **companies**, and **Miradi** (Compassion Churches) – all use the same organisation sign-up and portal.

---

## 2) Login and entry

**Who:** A user with role **organisation** and a valid **organisation ID** (set by CWK when the portal is created).

### 2.1 Log in

1. Organisation user opens CWK Hub and goes to **Login** (`/login`).
2. They sign in (MVP: select their organisation from the mock user list, e.g. “Compassion Miradi Portal” or “Riverside Academy Portal”).
3. The app stores the current user and redirects to **Organisation Dashboard** (`/organisation/dashboard`).
4. The user’s `organizationId` determines which organisation they belong to; all data in the portal is scoped to that organisation only.

### 2.2 If organisation not found

- If the logged-in user has role `organisation` but their `organizationId` does not match an existing organisation in the system, organisation pages show: *“Organisation not found. Please contact support.”*

---

## 3) Organisation Dashboard

**Route:** `/organisation/dashboard`

1. After login, the user lands on **Organisation portal**.
2. They see:
   - **Welcome**, [organisation name]
   - **Your organisation**: name and type (e.g. school, church, NGO).
   - **Learners**: total count of learners linked to their organisation, with a **View learners** button.
3. **View learners** goes to `/organisation/learners`.

---

## 4) Our learners (list)

**Route:** `/organisation/learners`

1. User opens **Our learners** from the dashboard or from the sidebar (**Our learners**).
2. They see the heading **Our learners** and subtext: “View details of learners linked to [organisation name]”.
3. **Search**: they can search by learner name or school. The list filters in real time.
4. **Table**: for each learner linked to their organisation:
   - Name
   - School
   - Status (e.g. active / alumni)
   - **View details** (link to learner profile).
5. If there are **no learners** linked to the organisation: “No learners are currently linked to your organisation.”
6. If **search has no matches**: “No learners match your search.”

**Data scope:** Only learners with `organizationId` equal to the current user’s organisation are shown. Learners from other organisations are never visible.

---

## 5) Learner detail (organisation view)

**Route:** `/organisation/learners/:id`

1. User clicks **View details** for a learner from the list.
2. If the learner is **not** linked to their organisation (e.g. wrong ID or another org’s learner), they see: *“Learner not found or not linked to your organisation.”* with a link back to **Our learners**.
3. If the learner **is** linked to their organisation, they see:

   **Header**
   - Learner name, school, date of birth, status (active / alumni).
   - **Back to learners** link.

   **Badges**
   - Total badges earned.
   - Up to three badge types with counts (e.g. “Scratch Explorer ×2”).

   **Progress by term (Term 1, Term 2, Term 3)**
   - **Schools** (and other orgs) work in **Term 1**, **Term 2**, and **Term 3**. A **term selector** (dropdown) lets them choose which term to view.
   - **Attendance for selected term**: attendance percentage and “X of Y sessions” for that term; list of session dates and status (Present / Absent / Late), e.g. latest 20 for that term.
   - **Enrolment history** (all terms): list of enrolments across terms: term name (e.g. Term 1 2025, Term 2 2025, Term 3 2025), class name, enrolment status (e.g. current / completed / withdrawn). This gives visibility into which classes the learner was in for each term.

4. User can go **Back to learners** to return to the list.

**Data scope:** The learner is loaded only if `learner.organizationId` matches the current user’s `organizationId`. No other organisation’s learners are accessible.

---

## 6) Navigation (organisation role)

Organisation users have a restricted sidebar:

- **Dashboard** → `/organisation/dashboard`
- **Our learners** → `/organisation/learners`

They do not see admin, educator, finance, student, or parent areas. If they try to open another role’s routes, they are not allowed (protected by role).

---

## Summary

| Step | Route / action | What happens |
|------|----------------|--------------|
| Sign up | `/signup/organisation` | Request portal access (name, type, contact). Confirmation; CWK sets up account. |
| Login | `/login` | Sign in → redirect to organisation dashboard. |
| Dashboard | `/organisation/dashboard` | See org name, type, learner count; link to learners list. |
| Learners list | `/organisation/learners` | Search and view only learners linked to their organisation. |
| Learner detail | `/organisation/learners/:id` | View one learner’s badges; **select Term 1, Term 2, or Term 3** to see attendance and progress for that term; enrolment history across all terms (org-scoped). |

**Applies to:** Schools, churches, NGOs, companies, and Miradi (Compassion Churches). All use the same organisation portal; data is always scoped to the logged-in user’s organisation. **Schools** work in Term 1, Term 2, and Term 3 and can see learner progress from every term.
