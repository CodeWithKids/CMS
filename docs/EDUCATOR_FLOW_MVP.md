# CWK Hub Educator Flow – MVP Spec

This document describes the full educator flow for the CWK Hub MVP, including lesson plans, learning tracks, devices, coaching, and badges.

---

## 1) Login and entry

1. Educator opens CWK Hub and goes to **Login**.
2. For MVP, they select their name (mock user) and sign in.
3. The app stores them as the current user and redirects to **Educator Dashboard** (`/educator/dashboard`).
4. If they try to open another role's home page, they're redirected back to the educator dashboard.

---

## 2) Weekly planning & visibility

### 2.1 My schedule / calendar

1. Educator opens **My Schedule / Calendar** (`/educator/schedule`).
2. They see a **week view** (Mon–Sun vs time).
3. They add or adjust blocks for the upcoming week:
   - "Mon 10–12 – Facilitating Class A (School X)"
   - "Tue 14–16 – Coaching Class B (Makerspace)"
   - "Wed 9–11 – Unavailable"
4. Existing scheduled sessions from CWK (generated from classes) appear on this grid so they see:
   - Real sessions (with track and class).
   - Their own availability.

### 2.2 Coaching assignment via sessions / calendar

1. For a session, the **facilitator** or admin can add a **coach**:
   - Choose "Add coach", pick another educator.
2. That session now has:
   - `facilitatorId` = main educator.
   - `coachIds` = one or more coaches.
3. The coach's calendar also shows that session block, tagged as **Coaching**.

**Visibility:**
- Admin, finance, and other educators can see all calendars (read‑only) so they know who is facilitating, who is coaching, and who is free.

---

## 3) Devices (laptop checkout)

1. From the sidebar, educator opens **Inventory** (`/inventory`).
2. They see all devices (e.g. laptops):
   - Status: Available / Checked out.
   - If checked out: which educator has it and since when.
3. To use a laptop, they open its detail and click **Check out** if available.
4. CWK Hub assigns the device to them and shows it under **My devices** (either on dashboard or in inventory):
   - Device name, checkout date, optional due date.
5. When finished, they open the device again and click **Return**, freeing it for others.

---

## 4) Educator Dashboard

On `/educator/dashboard` they see a **teaching cockpit**.

### 4.1 Today's sessions

- List of **today's sessions** where they are facilitator or coach.
- Each session card shows:
  - Time, class, location.
  - Role badge: Facilitator / Coach.
  - Learning track (e.g. "Scratch Beginners", "Python Level 1").
  - Device indicator (if a laptop is checked out).
  - Status chips:
    - Lesson plan: Pending / Draft / Ready.
    - Attendance: Pending / Done.
    - Report: Pending / Submitted.
    - Expenses: Pending / Logged.
  - Quick buttons: **Lesson plan**, **Attendance**, **Report**, **Expenses**.

### 4.2 Upcoming & past sessions

- **Upcoming sessions**: same structure, filtered for future dates.
- **Past sessions**: recent sessions with their completion status, mostly read‑only for reports/plans.

### 4.3 My classes

- List of classes they are assigned to, each with:
  - Class info (name, age group, location).
  - Learning tracks running in that class.
- Each links to **Class detail**.

### 4.4 Hours & activity summary

- "This week / this term":
  - X hours **facilitating**.
  - Y hours **coaching**.
  - Number of sessions and classes.

### 4.5 My devices & notes (optional)

- **My devices**: laptops and other equipment currently checked out.
- Quick **notes/reminders** per day or per upcoming session ("Bring micro:bits", "Check laptop 4 battery").

---

## 5) Class detail

When an educator opens **Class detail** (`/educator/classes/:id`):

1. They see class info: name, program, age group, location, learners this term.
2. Enrolment by term: list of learners with status (active / completed / dropped).
3. Attendance summary: average attendance, low‑attendance alerts.
4. **Sessions table** for this class, each row showing:
   - Date, time, topic, learning track.
   - Their role for that session (Facilitator / Coach).
   - Status chips (Lesson plan, Attendance, Report, Expenses).
   - Links to: **Lesson plan**, **Attendance**, **Report**, **Expenses**.

---

## 6) Lesson plans (track‑based templates)

Every session in CWK Hub is connected to a **learning track**.

### 6.1 Selecting a prebuilt lesson plan

1. Educator clicks **Lesson plan** for a session (`/educator/sessions/:id/lesson-plan`).
2. CWK Hub reads the session's **learning track** (e.g. "Robotics Level 1 – Week 4").
3. It auto‑filters the **Lesson Plan Library** to show only templates for that track (and level/unit).
4. The educator sees a short list of templates, for example:
   - "Week 4 – Motors & Movement" (Robotics)
   - "Week 4 – Sensor Challenge"
5. They preview a template and click **Use this plan**.
6. The template is copied into a **session‑specific lesson plan**, tied to that session.

### 6.2 Editable fields in the session plan

In the **session's copy** of the lesson plan, the educator can edit:

- **Metadata (mostly read‑only or lightly editable)**
  - Track / module, session date/time, class, level/age group.

- **Objectives & outcomes**
  - Lesson title.
  - Learning objectives.
  - Success criteria.

- **Prior knowledge & context**
  - Prerequisites / what learners should already know.
  - Notes linking to previous/next sessions.

- **Materials & setup**
  - Devices and tools (laptops, robots).
  - Software/platforms (Scratch, MakeCode, etc.).
  - Other materials (printouts, markers).
  - Setup notes.

- **Lesson structure (timed blocks)**
  - Warm‑up / hook: time, description, activity.
  - Main activity blocks (time, description, grouping).
  - Wrap‑up / reflection: time, description.

- **Differentiation & extension**
  - Support strategies for learners who struggle.
  - Extension ideas for advanced learners.

- **Assessment & evidence**
  - How understanding will be checked.
  - What counts as success for this lesson.

- **Homework / follow‑up (optional)**
  - Take‑home activities or "try this at home" prompts.

### 6.3 States and roles

- Lesson plan state per session:
  - Not started → Draft → Ready.
- Dashboard/session table show the current state.

Permissions:

- **Facilitator**
  - Selects the template and edits the plan for the session.
- **Coach**
  - Can view the plan (read‑only).
  - Optionally leave coach‑only notes.
- **Admin**
  - Can view all plans and see which template they came from.

---

## 7) In‑session and post‑session tasks

For any session the educator is part of:

### 7.1 Attendance

1. They open **Attendance** (`/educator/sessions/:id/attendance`).
2. They see session details and the learners list.
3. For each learner:
   - Select Present / Absent / Late / Excused.
   - Add optional note, star rating, and badge.
4. Use **Mark all present** when appropriate.
5. On **Save**, attendance and badges are stored; this session shows **Attendance done** on dashboard/class detail.

### 7.2 Session report

1. They open **Session report** (`/educator/sessions/:id/report`).
2. If no report exists:
   - They fill fields (what was covered, learner highlights, challenges, changes from plan, incidents and follow‑ups).
   - Save as Draft or Submit.
3. When they **Submit**:
   - One "official" report is stored for that session and educator.
   - The report becomes read‑only (or editable in place).
   - Dashboard/class detail show **Report submitted**.

### 7.3 Session expenses

1. They open **Expenses** (`/educator/sessions/:id/expenses`).
2. They log costs (amount, category, billed party, notes).
3. On save, expenses are recorded for later finance review.

### 7.4 Collaboration on the session

On each session page:

- Show chips for **Facilitator** and **Coach(es)**.
- If they're a coach, they may have a small **coach feedback** section visible only to admin/lead educator.

---

## 8) Educator profile: sessions, hours, tracks, badges

On the **Educator Profile** page:

1. **Basic info**
   - Name, avatar, main location, roles (Educator, Coach).

2. **Sessions history**
   - Total sessions.
   - Breakdown: Sessions as Facilitator / Sessions as Coach.
   - Filterable list of sessions (date, class, location, role, learning track).

3. **Hours taught**
   - Total **facilitating hours** (sum of durations where they are facilitator).
   - Total **coaching hours** (durations where they are coach).
   - Optional breakdown by term/year.

4. **Learning tracks facilitated**
   - For each track: sessions facilitated, hours facilitated.
   - Example: Scratch Beginners – 24 sessions, 36 hours; Python – 18 sessions, 27 hours.

5. **Educator badges (track mastery)**
   - CWK‑defined badges (e.g. Python Master, Robotics Master, Scratch Champion).
   - Earned by rules: minimum sessions/hours in that track, optional quality thresholds.
   - Profile shows badges with earned dates and criteria summaries.
   - Badges can appear on the dashboard ("You are a Python Master educator").

---

## 9) How the team uses this educator flow

- **Admins** – See calendars, sessions, and load (facilitating vs coaching) to assign classes and coaches fairly. Review lesson plans and reports for quality.
- **Finance** – Use hours and expenses per educator, per period, for stipends/bonuses.
- **Other educators** – See colleagues' schedules and device usage; understand who is facilitating/coaching each session.

---

*Flow summary: Login → plan week (schedule) → pick & customise lesson plans by track → manage devices (checkout/return) → use Today to run sessions (lesson plan, attendance, report, expenses) as facilitator/coach → build a profile of sessions, hours, tracks, and mastery badges.*
