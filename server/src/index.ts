import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import termsRoutes from "./routes/terms.js";
import learnersRoutes from "./routes/learners.js";
import classesRoutes from "./routes/classes.js";
import sessionsRoutes from "./routes/sessions.js";
import financeRoutes from "./routes/finance.js";
import organisationsRoutes from "./routes/organisations.js";
import educatorsRoutes from "./routes/educators.js";
import sessionReportsRoutes from "./routes/sessionReports.js";
import adminRoutes from "./routes/admin.js";
import parentsRoutes from "./routes/parents.js";
import partnersRoutes from "./routes/partners.js";
import eventsRoutes from "./routes/events.js";
import inventoryRoutes from "./routes/inventory.js";
import lessonPlansRoutes from "./routes/lessonPlans.js";
import coachingNotesRoutes from "./routes/coachingNotes.js";
import programsRoutes from "./routes/programs.js";
import locationsRoutes from "./routes/locations.js";
import ageGroupsRoutes from "./routes/ageGroups.js";
import incomeSourcesRoutes from "./routes/incomeSources.js";
import expenseCategoriesRoutes from "./routes/expenseCategories.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === "production";
const corsOrigin = process.env.CORS_ORIGIN;

// In production, restrict CORS to your frontend URL. In dev, allow any (origin: true).
app.use(
  cors({
    origin:
      isProduction && typeof corsOrigin === "string" && corsOrigin.length > 0
        ? corsOrigin
        : true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok", service: "cwk-hub-api" });
});

app.use("/v1/auth", authRoutes);
app.use("/v1/terms", termsRoutes);
app.use("/v1/learners", learnersRoutes);
app.use("/v1/classes", classesRoutes);
app.use("/v1/sessions", sessionsRoutes);
app.use("/v1/finance", financeRoutes);
app.use("/v1/organisations", organisationsRoutes);
app.use("/v1/educators", educatorsRoutes);
app.use("/v1/session-reports", sessionReportsRoutes);
app.use("/v1/admin", adminRoutes);
app.use("/v1/parents", parentsRoutes);
app.use("/v1/partners", partnersRoutes);
app.use("/v1/inventory", inventoryRoutes);
app.use("/v1/lesson-plans", lessonPlansRoutes);
app.use("/v1/coaching-notes", coachingNotesRoutes);
app.use("/v1/events", eventsRoutes);
app.use("/v1/programs", programsRoutes);
app.use("/v1/locations", locationsRoutes);
app.use("/v1/age-groups", ageGroupsRoutes);
app.use("/v1/income-sources", incomeSourcesRoutes);
app.use("/v1/expense-categories", expenseCategoriesRoutes);

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorHandler(req, res, next, err);
});

app.listen(port, () => {
  console.log(`CWK Hub API listening on http://localhost:${port}`);
  console.log("  Health: GET /health");
  console.log("  Auth:   POST /v1/auth/login, GET /v1/auth/me, POST /v1/auth/logout");
  console.log("  Terms:  GET /v1/terms, GET /v1/terms/current");
  console.log("  Learners: GET /v1/learners, GET /v1/learners/:id");
  console.log("  Classes: GET /v1/classes, GET /v1/classes/:id");
  console.log("  Sessions: GET /v1/sessions, GET /v1/sessions/:id");
  console.log("  Finance: GET/POST /v1/finance/invoices, GET /v1/finance/invoices/:id, GET/POST /v1/finance/invoices/:id/payments");
  console.log("  Orgs:    GET /v1/organisations/:id, GET /v1/organisations/:id/learners, GET /v1/organisations/:id/invoices");
  console.log("  Educators: GET /v1/educators, GET /v1/educators/:id");
  console.log("  Partners: GET /v1/partners/organisations, GET /v1/partners/parents, GET /v1/partners/learners");
  console.log("  Events:   GET /v1/events, GET /v1/events/:slug");
  console.log("  Inventory: GET/POST/PATCH/DELETE /v1/inventory/items");
  console.log("  Lesson plans: GET/POST/PATCH /v1/lesson-plans/templates, GET/POST/PATCH /v1/lesson-plans/instances");
  console.log("  Coaching notes: GET/POST /v1/coaching-notes");
});
