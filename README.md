# Code With Kids Operations System (CWK-CMS)

A web application for running and managing **Code With Kids** — coding and technology programs for children. The system supports multiple user roles (Admin, Educator, Finance, Student, Parent) with role-specific dashboards, learner management, class and session tracking, attendance, invoicing, and student feedback.

---

## What the project does

CWK-CMS is an **operations and learning hub** for a kids' coding program. It lets:

- **Staff** manage learners and classes, and run sessions with attendance.
- **Educators** see their schedule and mark who attended each session.
- **Students** see their timetable, access learning platforms, and submit feedback.
- **Parents** see their children's next sessions, attendance, and invoices.

The current codebase is a **React frontend** that uses **mock data** only. It is intended to be connected to a real backend (API) later.

---

## User roles and features

### Admin & Finance

- **Learners** — List of all learners with name, school, parent phone/email, and status. "View" opens a learner profile.
- **Learner profile** — Details (name, age from DOB, school, parent contacts, status) plus placeholder sections for:
  - **Platforms** — Scratch, Tinkercad, Typing.com, Roblox (linked accounts; placeholder for now).
  - **Modules** — Learning modules enrolled in or completed (placeholder).
- **Classes** — Table of classes with name, program, age group, location, and educator.

### Educator

- **Dashboard** — "Today's sessions" (sessions for this educator) and "My classes" with links to class detail and attendance.
- **Class detail** (`/educator/classes/:id`) — Class info and list of sessions, each with an "Attendance" link.
- **Attendance** (`/educator/sessions/:id/attendance`) — Table of learners in that class/session with a dropdown per learner: **Present** / **Absent** / **Late**. State is stored in memory (no backend yet).

### Student

- **Dashboard** — Today's sessions, quick-link buttons to external platforms (Scratch, Typing.com, Tinkercad, Roblox, PyGolfers), and upcoming events.
- **Timetable** — Table of upcoming sessions (date, time, class, educator ID, location, topic).
- **Resources** — Grid of resource tiles (platform name, short description, "Open" button opening the platform in a new tab).
- **Feedback** — List of recent sessions with "Give feedback". Modal form: rating (1–5), "Did you understand?" (Yes/No/Somewhat), "What did you like most?", "What can we improve?". Submissions are kept in local state only.

### Parent

- **Dashboard** — One card per child (mock: 1–2 children) showing name, next session (date/time/class/topic), and a simple attendance summary (e.g. "8/10 sessions attended" — mocked).
- **Invoices** — Table of invoices: invoice number, child name, term, total amount, and status with chips: **Paid** / **Unpaid** / **Partially paid**.

---

## Technology stack

| Area | Choice |
|------|--------|
| Build & dev server | [Vite](https://vitejs.dev/) |
| UI framework | [React](https://react.dev/) 18 |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Routing | [React Router](https://reactrouter.com/) v6 |
| UI components & styling | [shadcn/ui](https://ui.shadcn.com/) (Radix UI) + [Tailwind CSS](https://tailwindcss.com/) |

shadcn/ui and Tailwind provide data-heavy components (tables, cards, dialogs, forms), TypeScript support, and flexible theming — suitable for an operations-style app.

---

## Architecture overview

- **Single-page app (SPA)** — One React app; routing is client-side.
- **Role-based access** — Routes are protected by role. If a user hits a route for another role, they are redirected to their role's default page (e.g. student → `/student/dashboard`).
- **Fake authentication** — An `AuthContext` holds the current user (`id`, `name`, `role`). Login selects a user from mock users; the chosen user is persisted in `localStorage`. A role switcher in the UI lets you switch roles during development.
- **Mock data** — All lists and details come from in-memory arrays in `src/mockData/index.ts` (learners, classes, sessions, invoices, events, class enrollments). No API calls yet.
- **Layout** — Top navbar ("Code With Kids" + role switcher), left sidebar (menu items depend on role), main content area for each page.

---

## Data model (core entities)

Defined in `src/types/index.ts` and reflected in mock data:

| Entity | Main fields |
|--------|-------------|
| **User** | `id`, `name`, `role`, optional `avatarId` (students: preset avatar from approved gallery) |
| **Learner** | `id`, `firstName`, `lastName`, `dateOfBirth`, `school`, `parentName`, `parentPhone`, `parentEmail`, `status` |
| **Class** | `id`, `name`, `program`, `ageGroup`, `location`, `educatorId`, `learnerIds` |
| **Session** | `id`, `classId`, `date`, `startTime`, `endTime`, `topic`, `sessionType`, `duration`, `learningTrack` |
| **Invoice** | `id`, `learnerId`, `invoiceNumber`, `term`, `totalAmount`, `status` (`draft` \| `sent` \| `partially_paid` \| `paid`) |
| **Event** | `id`, `title`, `date`, `time`, `description`, `target` |
| **Attendance** | Per learner per session: `present` \| `absent` \| `late` (UI only; not yet persisted). |
| **Student feedback** | `sessionId`, `studentId`, `rating`, `understood`, `likedMost`, `improvement` (local state only). |

**Invoicing and who pays:** Invoices have a `source` (e.g. School STEM Club, Makerspace, Organisation). **School STEM Club** and **Organisation** sessions are not paid by learners or parents: the invoice is sent to the **school** or **organisation**, and they pay Code With Kids directly (same as organisation sessions). Other sources (e.g. makerspace, home sessions, camps) are typically learner/parent fees.

---

## Project structure

```
CWK-CMS/
├── src/
│   ├── components/           # Reusable UI and layout
│   │   ├── layout/           # AppLayout, ProtectedRoute
│   │   ├── ui/               # shadcn/ui components (button, card, table, etc.)
│   │   └── NavLink.tsx
│   ├── context/
│   │   └── AuthContext.tsx   # Fake auth: currentUser, login, logout
│   ├── hooks/                # use-toast, use-mobile
│   ├── lib/
│   │   └── utils.ts
│   ├── mockData/
│   │   └── index.ts          # All mock arrays and helpers
│   ├── pages/                # One component per main screen
│   │   ├── auth/             # LoginPage
│   │   ├── admin/            # Learners list, learner profile, classes
│   │   ├── educator/         # Dashboard, class detail, attendance
│   │   ├── student/          # Dashboard, timetable, resources, feedback
│   │   └── parent/           # Dashboard, invoices
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces for entities
│   ├── App.tsx               # Router, auth provider, routes
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md                 # This file
```

---

## How to run the frontend

**Prerequisites:** Node.js and npm (or equivalent).

```bash
# Install dependencies (first time or after pull)
npm install

# Start the development server
npm run dev
```

Then open the URL shown in the terminal (typically **http://localhost:8080**).

- Log in via the login page by selecting a user (or you are "logged in" as the user stored in `localStorage`).
- Use the role switcher in the UI to switch to educator, student, parent, or finance and see the corresponding sidebar and pages.

**Other scripts:**

- `npm run build` — Production build (TypeScript compile + Vite build).
- `npm run preview` — Serve the production build locally.
- `npm run lint` — Run ESLint.
- `npm run test` — Run tests (Vitest).

---

## Routes reference

| Path | Allowed roles | Purpose |
|------|----------------|---------|
| `/login` | (public) | Login page (select user from mock list) |
| `/admin/learners` | admin, finance | Learners list |
| `/admin/learners/:id` | admin, finance | Learner profile |
| `/admin/classes` | admin, finance | Classes list |
| `/educator/dashboard` | educator | Educator dashboard |
| `/educator/classes/:id` | educator | Class detail & sessions |
| `/educator/sessions/:id/attendance` | educator | Session attendance |
| `/student/dashboard` | student | Student dashboard |
| `/student/profile` | student | Student profile — choose preset avatar (no photo uploads) |
| `/student/timetable` | student | Student timetable |
| `/student/resources` | student | Learning resources |
| `/student/feedback` | student | Session feedback |
| `/parent/dashboard` | parent | Parent dashboard |
| `/parent/invoices` | parent | Invoices list |

Accessing a route for a different role redirects to that role's home (e.g. `/student/dashboard` for students).

---

## Product policies

### Student profile avatars

- **Students must use a preset avatar** instead of real photos for their profile. They choose from a safe, curated collection of images we provide (no uploads).
- **No real student photos** are allowed anywhere in the student profile image field.
- Students can **only pick from an approved avatar gallery** (e.g. fun characters, abstract icons, initials, robots). They can change their avatar later, but only by selecting from this list (no upload button).
- **Avatars must not reveal personal information**: no names, school logos, or identifiable uniforms in the image. All preset avatars are generic and safe for use in the learning environment.

---

## Next steps (when adding a backend)

- **Replace mock data** — Add API clients or hooks (e.g. `useLearners`, `useClasses`) that call your backend. Swap these in where `mockData` is used today. TanStack React Query is already in the stack and can be used for data fetching and caching.
- **Real auth** — Replace the mock user selection in `AuthContext` with a "me" or session endpoint; set `currentUser` from the response and handle logged-out state (e.g. redirect to `/login`).
- **Persistence** — Persist attendance and feedback via API calls from the educator and student pages.
