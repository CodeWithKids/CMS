# Role-based permissions (CWK Hub)

## Principles

- **Everyone can Read** what they need for their work.
- **Create/Update/Delete** is restricted by role and ownership (e.g. “their” learners, “their” reports).
- **Dangerous actions** (deleting users, core settings) are **Admin only**.

## Settings module (Terms, Programs, Locations, Age groups, Income sources, Expense categories)

| Action   | Admin | Everyone else |
|----------|--------|----------------|
| **Read** (GET)  | Yes | Yes (authenticated or public, depending on route) |
| **Create** (POST) | Yes | No (403) |
| **Update** (PATCH) | Yes | No (403) |
| **Delete** (DELETE) | Yes | No (403) |

**Backend:** All Settings write routes use `requireAuth` and an `isAdmin` check; non-admin receives 403 with message "Admin only."

**Frontend:** Add/Edit/Delete buttons on `/admin/settings` are shown only when `currentUser?.role === "admin"` and API is enabled.

## Other modules (to be defined)

Per-module matrices to be added for:

- **Events** – e.g. Marketing create/update/delete own; others read or limited.
- **Learners** – Admin full CRUD; Org/Parent limited to their learners; Educators read-only (or as defined).
- **Session reports** – Educators create/update own; L&D/Admin full; delete rules TBD.
- **Finance** – Finance role vs Admin; who can delete.
- **Partners / organisations** – Partnerships role vs Admin.

See product/permission matrix for each module before implementing.
