import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SessionExpensesProvider } from "@/context/SessionExpensesContext";
import { AttendanceProvider } from "@/context/AttendanceContext";
import { SessionReportsProvider } from "@/context/SessionReportsContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { EnrollmentsProvider } from "@/context/EnrollmentsContext";
import { BadgeAwardsProvider } from "@/context/BadgeAwardsContext";
import { ScheduleProvider } from "@/context/ScheduleContext";
import { LessonPlansProvider } from "@/context/LessonPlansContext";
import { SessionsProvider } from "@/context/SessionsContext";
import { EducatorNotesProvider } from "@/context/EducatorNotesContext";
import { FinanceProvider } from "@/context/FinanceContext";

import LoginPage from "@/pages/auth/LoginPage";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
import LearnersPage from "@/pages/admin/LearnersPage";
import LearnerDetailPage from "@/pages/admin/LearnerDetailPage";
import ClassesPage from "@/pages/admin/ClassesPage";
import ClassEnrollmentsPage from "@/pages/admin/ClassEnrollmentsPage";
import SessionReportsPage from "@/pages/admin/SessionReportsPage";
import SessionReportDetailPage from "@/pages/admin/SessionReportDetailPage";
import AdminSchedulesPage from "@/pages/admin/AdminSchedulesPage";
import StaffDirectoryPage from "@/pages/admin/StaffDirectoryPage";
import StaffProfilePage from "@/pages/admin/StaffProfilePage";
import SettingsPage from "@/pages/admin/SettingsPage";
import EducatorPaymentsPage from "@/pages/admin/EducatorPaymentsPage";
import EducatorHoursPage from "@/pages/admin/EducatorHoursPage";
import ExpensesPage from "@/pages/admin/ExpensesPage";
import AccountApprovalsPage from "@/pages/admin/AccountApprovalsPage";

const FinanceDashboardPage = lazy(() => import("@/pages/finance/FinanceDashboardPage"));
import InvoiceListPage from "@/pages/finance/InvoiceListPage";
import InvoiceDetailPage from "@/pages/finance/InvoiceDetailPage";
import AdjustmentsListPage from "@/pages/finance/AdjustmentsListPage";
import AdjustmentDetailPage from "@/pages/finance/AdjustmentDetailPage";
import EducatorsListPage from "@/pages/finance/EducatorsListPage";
import EducatorFinanceDetailPage from "@/pages/finance/EducatorFinanceDetailPage";
import FinanceInventoryPage from "@/pages/finance/FinanceInventoryPage";
import FinanceReportsPage from "@/pages/finance/FinanceReportsPage";
import FinanceEducatorPaymentsPage from "@/pages/finance/EducatorPaymentsPage";
import FinanceIncomePage from "@/pages/finance/IncomePage";
import FinanceExpensesPage from "@/pages/finance/ExpensesPage";
import SessionExpensesPage from "@/pages/finance/SessionExpensesPage";
import YearOverviewPage from "@/pages/finance/YearOverviewPage";

const EducatorDashboard = lazy(() => import("@/pages/educator/EducatorDashboard"));
import EducatorSchedulePage from "@/features/educator/components/EducatorSchedulePage";
import TeamSchedulePage from "@/pages/educator/TeamSchedulePage";
import EducatorEarningsPage from "@/pages/educator/EducatorEarningsPage";
import ClassDetailPage from "@/pages/educator/ClassDetailPage";
import AttendancePage from "@/pages/educator/AttendancePage";
import SessionExpensePage from "@/pages/educator/SessionExpensePage";
import SessionReportPage from "@/pages/educator/SessionReportPage";
import SessionLessonPlanPage from "@/pages/educator/SessionLessonPlanPage";
import EducatorProfilePage from "@/pages/educator/EducatorProfilePage";

import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentProfilePage from "@/pages/student/StudentProfilePage";
import TimetablePage from "@/pages/student/TimetablePage";
import ResourcesPage from "@/pages/student/ResourcesPage";
import FeedbackPage from "@/pages/student/FeedbackPage";

import ParentDashboard from "@/pages/parent/ParentDashboard";
import InvoicesPage from "@/pages/parent/InvoicesPage";
import ParentInvoiceDetailPage from "@/pages/parent/ParentInvoiceDetailPage";
import ParentChildDetailPage from "@/pages/parent/ParentChildDetailPage";

import InventoryListPage from "@/pages/inventory/InventoryListPage";
import InventoryDetailPage from "@/pages/inventory/InventoryDetailPage";
import InventoryFormPage from "@/pages/inventory/InventoryFormPage";

import OrganisationSignUpPage from "@/pages/organisation/OrganisationSignUpPage";
import OrganisationDashboardPage from "@/pages/organisation/OrganisationDashboardPage";
import OrganisationLearnersPage from "@/pages/organisation/OrganisationLearnersPage";
import OrganisationLearnerDetailPage from "@/pages/organisation/OrganisationLearnerDetailPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <EnrollmentsProvider>
        <SessionsProvider>
        <EducatorNotesProvider>
        <ScheduleProvider>
        <LessonPlansProvider>
        <SessionExpensesProvider>
        <BadgeAwardsProvider>
        <AttendanceProvider>
        <SessionReportsProvider>
        <InventoryProvider>
        <FinanceProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup/organisation" element={<OrganisationSignUpPage />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "finance"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/finance" element={<Navigate to="/finance/dashboard" replace />} />
              <Route path="/finance/dashboard" element={<FinanceDashboardPage />} />
              <Route path="/finance/invoices" element={<InvoiceListPage />} />
              <Route path="/finance/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/finance/adjustments" element={<AdjustmentsListPage />} />
              <Route path="/finance/adjustments/:id" element={<AdjustmentDetailPage />} />
              <Route path="/finance/educators" element={<EducatorsListPage />} />
              <Route path="/finance/educators/:id" element={<EducatorFinanceDetailPage />} />
              <Route path="/finance/inventory" element={<FinanceInventoryPage />} />
              <Route path="/finance/reports" element={<FinanceReportsPage />} />
              <Route path="/finance/educator-payments" element={<FinanceEducatorPaymentsPage />} />
              <Route path="/finance/income" element={<FinanceIncomePage />} />
              <Route path="/finance/expenses" element={<FinanceExpensesPage />} />
              <Route path="/finance/year-overview" element={<YearOverviewPage />} />
              <Route path="/finance/session-expenses" element={<SessionExpensesPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/hr/staff" element={<StaffDirectoryPage />} />
              <Route path="/admin/hr/staff/:id" element={<StaffProfilePage />} />
              <Route path="/admin/finance/educator-payments" element={<EducatorPaymentsPage />} />
              <Route path="/admin/educator-hours" element={<EducatorHoursPage />} />
              <Route path="/admin/finance/expenses" element={<ExpensesPage />} />
              <Route path="/admin/account-approvals" element={<AccountApprovalsPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/learners" element={<LearnersPage />} />
              <Route path="/admin/learners/:id" element={<LearnerDetailPage />} />
              <Route path="/admin/classes" element={<ClassesPage />} />
              <Route path="/admin/classes/:id/enrolments" element={<ClassEnrollmentsPage />} />
              <Route path="/admin/session-reports" element={<SessionReportsPage />} />
              <Route path="/admin/session-reports/:id" element={<SessionReportDetailPage />} />
              <Route path="/admin/schedules" element={<AdminSchedulesPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin", "educator"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/inventory" element={<InventoryListPage />} />
              <Route path="/inventory/new" element={<InventoryFormPage />} />
              <Route path="/inventory/:id" element={<InventoryDetailPage />} />
              <Route path="/inventory/:id/edit" element={<InventoryFormPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["educator"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/educator/dashboard" element={<EducatorDashboard />} />
              <Route path="/educator/schedule" element={<EducatorSchedulePage />} />
              <Route path="/educator/team-schedule" element={<TeamSchedulePage />} />
              <Route path="/educator/profile" element={<EducatorProfilePage />} />
              <Route path="/educator/earnings" element={<EducatorEarningsPage />} />
              <Route path="/educator/classes/:id" element={<ClassDetailPage />} />
              <Route path="/educator/sessions/:id/lesson-plan" element={<SessionLessonPlanPage />} />
              <Route path="/educator/sessions/:id/attendance" element={<AttendancePage />} />
              <Route path="/educator/sessions/:id/expenses" element={<SessionExpensePage />} />
              <Route path="/educator/sessions/:id/report" element={<SessionReportPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["student"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
              <Route path="/student/timetable" element={<TimetablePage />} />
              <Route path="/student/resources" element={<ResourcesPage />} />
              <Route path="/student/feedback" element={<FeedbackPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["parent"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/invoices" element={<InvoicesPage />} />
              <Route path="/parent/invoices/:id" element={<ParentInvoiceDetailPage />} />
              <Route path="/parent/children/:id" element={<ParentChildDetailPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["organisation"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/organisation/dashboard" element={<OrganisationDashboardPage />} />
              <Route path="/organisation/learners" element={<OrganisationLearnersPage />} />
              <Route path="/organisation/learners/:id" element={<OrganisationLearnerDetailPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </FinanceProvider>
        </InventoryProvider>
        </SessionReportsProvider>
        </AttendanceProvider>
        </BadgeAwardsProvider>
        </SessionExpensesProvider>
        </LessonPlansProvider>
        </ScheduleProvider>
        </EducatorNotesProvider>
        </SessionsProvider>
        </EnrollmentsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
