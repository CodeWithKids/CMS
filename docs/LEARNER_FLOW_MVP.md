# CWK Hub Learner Flow – MVP Spec

This document describes learner user flows in the CWK Hub MVP. **Only Code With Kids members (Makerspace learners with active membership) can log in** to the learner portal. Learners associated with school clubs, organisations, or Miradi have a different experience and do **not** have login access.

---

## Who can log in

| Learner context | Program type | Can log in? | Experience |
|-----------------|--------------|-------------|------------|
| **Code With Kids member** | MAKERSPACE, active membership | ✅ Yes | Full student portal (dashboard, profile, timetable, resources, feedback). |
| **School club** | SCHOOL_CLUB | ❌ No | Attends classes at school; no learner account or portal. |
| **Organisation** | ORGANISATION (partner org) | ❌ No | Attends via organisation (school, church, NGO); org pays; no learner account. |
| **Miradi** | ORGANISATION (Miradi / Compassion Churches) | ❌ No | Attends via Miradi programme; org pays; no learner account. |

---

## 1) Member learner (Code With Kids member) – can log in

**Who:** A learner enrolled in **Makerspace** with **active** membership and a linked user account.

### 1.1 Login and entry

1. Learner (or parent on their behalf) opens CWK Hub and goes to **Login**.
2. They sign in with their credentials (MVP: select their name from the mock user list).
3. The system checks that the user is a **student** linked to a learner with:
   - `programType === "MAKERSPACE"`
   - `membershipStatus === "active"`
4. If either check fails, login is **blocked** with the message: *"Only active Makerspace members can log in. Please check your membership."*
5. If checks pass, the app stores the current user and redirects to **Student Dashboard** (`/student/dashboard`).

### 1.2 After login – student portal

- **Dashboard** (`/student/dashboard`): Welcome, today’s sessions, quick links to learning platforms (Scratch, Typing.com, Tinkercad, Roblox, PyGolfers), upcoming events. Option to choose a preset avatar if not set.
- **Profile** (`/student/profile`): Preset avatar selection, learning platform profile links (e.g. Scratch, Typing.com). No photo uploads.
- **Timetable** (`/student/timetable`): When and where their classes are.
- **Resources** (`/student/resources`): Learning resources.
- **Feedback** (`/student/feedback`): Give or view feedback related to their sessions.

Only learners who are **Makerspace members with active membership** see this flow.

---

## 2) School club learner – no login

**Who:** A learner whose programme is **School club** (`programType === "SCHOOL_CLUB"`). They may be `enrolmentType: "member"` (parent contact on file) but they do **not** have a user account or membership status.

### 2.1 Experience

1. They do **not** have a CWK Hub login or student account.
2. They participate in Code With Kids sessions at their **school**; the school (or club) is the partner.
3. Billing is typically to the **school** (payer type SCHOOL or similar), not to the parent as an individual member.
4. Their progress, attendance, and sessions are managed by **educators and admins** in the CWK Hub; the learner does not access the hub.
5. If a parent wants to see progress, that is through the school or through staff (no learner portal for this path).

**Difference from member learner:** No login, no student dashboard, no profile/timetable/resources/feedback in the app. Experience is entirely through the school and staff.

---

## 3) Organisation learner – no login

**Who:** A learner linked to an **organisation** (e.g. church, NGO, other partner) with `programType === "ORGANISATION"`, often `enrolmentType: "partner_org"` and `organizationId` set.

### 3.1 Experience

1. They do **not** have a CWK Hub login or student account.
2. They participate in Code With Kids programmes through the **organisation**; the organisation is the partner and typically the **payer** (payer type ORGANISATION).
3. Their enrolment and sessions are managed by **educators and admins**; the **organisation** may have a portal (organisation role) to see their learners, but the **learner** does not log in as a student.
4. Contact and consent may be via the organisation rather than direct parent membership.

**Difference from member learner:** No login, no student portal. Experience is through the organisation and staff.

---

## 4) Miradi learner – no login

**Who:** A learner in a **Miradi** (Compassion Churches) programme. Operationally this is a type of organisation partner; sessions may be recorded as `MIRADI_SESSION` and payer as ORGANISATION.

### 4.1 Experience

1. They do **not** have a CWK Hub login or student account.
2. They participate in Code With Kids sessions through the **Miradi / Compassion Churches** partner.
3. The **organisation** (Miradi) pays; the learner is not a direct “member” with individual membership or invoice.
4. Their sessions and progress are managed by **educators and admins**; the Miradi organisation may have an organisation portal view, but the **learner** does not log in.

**Difference from member learner:** Same as organisation learners—no login, no student portal. Experience is through the Miradi partner and staff.

---

## Summary

| Flow | Login? | Where experience lives |
|------|--------|-------------------------|
| **Member (Makerspace, active)** | ✅ Yes | Student portal (dashboard, profile, timetable, resources, feedback). |
| **School club** | ❌ No | School / club; staff and educators in CWK Hub. |
| **Organisation** | ❌ No | Organisation partner; staff and org portal in CWK Hub. |
| **Miradi** | ❌ No | Miradi (Compassion) partner; staff and org portal in CWK Hub. |

Only **member learners** (Makerspace, active membership) can log in. School club, organisation, and Miradi learners have different, non-login flows and are supported through staff and partner (school/org) interfaces instead of the learner portal.
