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
import { LearnerFeedbackProvider } from "@/context/LearnerFeedbackContext";
import { PartnershipsProvider } from "@/context/PartnershipsContext";
import { MarketingProvider } from "@/context/MarketingContext";
import { SocialMediaProvider } from "@/context/SocialMediaContext";
import { CoachingNotesProvider } from "@/features/ld-manager/context/CoachingNotesContext";
import { TasksProvider } from "@/features/tasks/context/TasksContext";
import { EventRegistrationsProvider } from "@/context/EventRegistrationsContext";
import { CoachingInvitesProvider } from "@/context/CoachingInvitesContext";
import { NotificationsProvider } from "@/context/NotificationsContext";

import LoginPage from "@/pages/auth/LoginPage";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const LearnersPage = lazy(() => import("@/pages/admin/LearnersPage"));
const LearnerDetailPage = lazy(() => import("@/pages/admin/LearnerDetailPage"));
const ClassesPage = lazy(() => import("@/pages/admin/ClassesPage"));
const ClassEnrollmentsPage = lazy(() => import("@/pages/admin/ClassEnrollmentsPage"));
const SessionReportsPage = lazy(() => import("@/pages/admin/SessionReportsPage"));
const SessionReportDetailPage = lazy(() => import("@/pages/admin/SessionReportDetailPage"));
const AdminSchedulesPage = lazy(() => import("@/pages/admin/AdminSchedulesPage"));
const StaffDirectoryPage = lazy(() => import("@/pages/admin/StaffDirectoryPage"));
const StaffProfilePage = lazy(() => import("@/pages/admin/StaffProfilePage"));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const EducatorPaymentsPage = lazy(() => import("@/pages/admin/EducatorPaymentsPage"));
const EducatorProfilesListPage = lazy(() => import("@/pages/admin/EducatorProfilesListPage"));
const EducatorProfileDetailPage = lazy(() => import("@/pages/admin/EducatorProfileDetailPage"));
const ExpensesPage = lazy(() => import("@/pages/admin/ExpensesPage"));
const AccountApprovalsPage = lazy(() => import("@/pages/admin/AccountApprovalsPage"));

const FinanceDashboardPage = lazy(() => import("@/pages/finance/FinanceDashboardPage"));
const InvoiceListPage = lazy(() => import("@/pages/finance/InvoiceListPage"));
const InvoiceDetailPage = lazy(() => import("@/pages/finance/InvoiceDetailPage"));
const AdjustmentsListPage = lazy(() => import("@/pages/finance/AdjustmentsListPage"));
const AdjustmentDetailPage = lazy(() => import("@/pages/finance/AdjustmentDetailPage"));
const EducatorsListPage = lazy(() => import("@/pages/finance/EducatorsListPage"));
const EducatorFinanceDetailPage = lazy(() => import("@/pages/finance/EducatorFinanceDetailPage"));
const FinanceInventoryPage = lazy(() => import("@/pages/finance/FinanceInventoryPage"));
const FinanceReportsPage = lazy(() => import("@/pages/finance/FinanceReportsPage"));
const FinanceEducatorPaymentsPage = lazy(() => import("@/pages/finance/EducatorPaymentsPage"));
const FinanceIncomePage = lazy(() => import("@/pages/finance/IncomePage"));
const FinanceExpensesPage = lazy(() => import("@/pages/finance/ExpensesPage"));
const SessionExpensesPage = lazy(() => import("@/pages/finance/SessionExpensesPage"));
const YearOverviewPage = lazy(() => import("@/pages/finance/YearOverviewPage"));

const EducatorDashboard = lazy(() => import("@/pages/educator/EducatorDashboard"));
const EducatorSchedulePage = lazy(() => import("@/features/educator/components/EducatorSchedulePage"));
const EducatorEarningsPage = lazy(() => import("@/pages/educator/EducatorEarningsPage"));
const ClassDetailPage = lazy(() => import("@/pages/educator/ClassDetailPage"));
const AttendancePage = lazy(() => import("@/pages/educator/AttendancePage"));
const SessionExpensePage = lazy(() => import("@/pages/educator/SessionExpensePage"));
const SessionReportPage = lazy(() => import("@/pages/educator/SessionReportPage"));
const SessionLessonPlanPage = lazy(() => import("@/pages/educator/SessionLessonPlanPage"));
const EducatorProfilePage = lazy(() => import("@/pages/educator/EducatorProfilePage"));
const EducatorLearnerFeedbackPage = lazy(() => import("@/pages/educator/EducatorLearnerFeedbackPage"));
const EducatorTasksPage = lazy(() => import("@/pages/educator/EducatorTasksPage"));
const EducatorCoachingInvitesPage = lazy(() => import("@/pages/educator/EducatorCoachingInvitesPage"));

const StudentDashboard = lazy(() => import("@/pages/student/StudentDashboard"));
const StudentProfilePage = lazy(() => import("@/pages/student/StudentProfilePage"));
const TimetablePage = lazy(() => import("@/pages/student/TimetablePage"));
const ResourcesPage = lazy(() => import("@/pages/student/ResourcesPage"));
const FeedbackPage = lazy(() => import("@/pages/student/FeedbackPage"));

const ParentDashboard = lazy(() => import("@/pages/parent/ParentDashboard"));
const InvoicesPage = lazy(() => import("@/pages/parent/InvoicesPage"));
const ParentInvoiceDetailPage = lazy(() => import("@/pages/parent/ParentInvoiceDetailPage"));
const ParentChildDetailPage = lazy(() => import("@/pages/parent/ParentChildDetailPage"));
const ParentEventsPage = lazy(() => import("@/pages/parent/ParentEventsPage"));

const InventoryListPage = lazy(() => import("@/pages/inventory/InventoryListPage"));
const InventoryDetailPage = lazy(() => import("@/pages/inventory/InventoryDetailPage"));
const InventoryFormPage = lazy(() => import("@/pages/inventory/InventoryFormPage"));

const OrganisationSignUpPage = lazy(() => import("@/pages/organisation/OrganisationSignUpPage"));
const OrganisationDashboardPage = lazy(() => import("@/pages/organisation/OrganisationDashboardPage"));
const OrganisationLearnersPage = lazy(() => import("@/pages/organisation/OrganisationLearnersPage"));
const OrganisationLearnerDetailPage = lazy(() => import("@/pages/organisation/OrganisationLearnerDetailPage"));
const OrganisationInvoicesPage = lazy(() => import("@/pages/organisation/OrganisationInvoicesPage"));
const OrganisationInvoiceDetailPage = lazy(() => import("@/pages/organisation/OrganisationInvoiceDetailPage"));
const OrganisationEventsPage = lazy(() => import("@/pages/organisation/OrganisationEventsPage"));
const TeamEventsPage = lazy(() => import("@/pages/team/TeamEventsPage"));

const PartnershipsDashboardPage = lazy(() => import("@/pages/partnerships/PartnershipsDashboardPage"));
const PartnershipsListPage = lazy(() => import("@/pages/partnerships/PartnershipsListPage"));
const PartnershipsCampaignsPage = lazy(() => import("@/pages/partnerships/PartnershipsCampaignsPage"));

const MarketingDashboardPage = lazy(() => import("@/pages/marketing/MarketingDashboardPage"));
const MarketingCampaignsPage = lazy(() => import("@/pages/marketing/MarketingCampaignsPage"));

const SocialMediaDashboardPage = lazy(() => import("@/pages/social-media/SocialMediaDashboardPage"));
const SocialMediaContentPage = lazy(() => import("@/pages/social-media/SocialMediaContentPage"));

const LDDashboardPage = lazy(() => import("@/pages/ld/LDDashboardPage"));
const LDTracksPage = lazy(() => import("@/pages/ld/LDTracksPage"));
const LDLessonPlansPage = lazy(() => import("@/pages/ld/LDLessonPlansPage"));
const LDCoachingPage = lazy(() => import("@/pages/ld/LDCoachingPage"));
const LDCoachingDetailPage = lazy(() => import("@/pages/ld/LDCoachingDetailPage"));
const LDReportsPage = lazy(() => import("@/pages/ld/LDReportsPage"));
const LDProfilePage = lazy(() => import("@/pages/ld/LDProfilePage"));
const LDSessionReportsPage = lazy(() => import("@/pages/ld/LDSessionReportsPage"));
const LDSessionReportDetailPage = lazy(() => import("@/pages/ld/LDSessionReportDetailPage"));
const LDTasksPage = lazy(() => import("@/pages/ld/LDTasksPage"));

const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <EnrollmentsProvider>
        <SessionsProvider>
        <CoachingInvitesProvider>
        <EducatorNotesProvider>
        <ScheduleProvider>
        <LessonPlansProvider>
        <SessionExpensesProvider>
        <BadgeAwardsProvider>
        <AttendanceProvider>
        <SessionReportsProvider>
        <InventoryProvider>
        <FinanceProvider>
        <LearnerFeedbackProvider>
        <PartnershipsProvider>
        <MarketingProvider>
        <SocialMediaProvider>
        <CoachingNotesProvider>
        <TasksProvider>
        <NotificationsProvider>
        <EventRegistrationsProvider>
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
              <Route path="/admin/educator-profiles" element={<EducatorProfilesListPage />} />
              <Route path="/admin/educator-profiles/:id" element={<EducatorProfileDetailPage />} />
              <Route path="/admin/educator-hours" element={<Navigate to="/admin/educator-profiles" replace />} />
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
              <Route path="/events" element={<TeamEventsPage />} />
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
              <Route path="/educator/team-schedule" element={<Navigate to="/educator/schedule" replace />} />
              <Route path="/educator/coaching-invites" element={<EducatorCoachingInvitesPage />} />
              <Route path="/educator/learner-feedback" element={<EducatorLearnerFeedbackPage />} />
              <Route path="/educator/profile" element={<EducatorProfilePage />} />
              <Route path="/educator/earnings" element={<EducatorEarningsPage />} />
              <Route path="/educator/tasks" element={<EducatorTasksPage />} />
              <Route path="/educator/classes/:id" element={<ClassDetailPage />} />
              <Route path="/educator/sessions/:id/lesson-plan" element={<SessionLessonPlanPage />} />
              <Route path="/educator/sessions/:id/attendance" element={<AttendancePage />} />
              <Route path="/educator/sessions/:id/expenses" element={<SessionExpensePage />} />
              <Route path="/educator/sessions/:id/report" element={<SessionReportPage />} />
              <Route path="/events" element={<TeamEventsPage />} />
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
              <Route path="/parent/events" element={<ParentEventsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["organisation"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/organisation/dashboard" element={<OrganisationDashboardPage />} />
              <Route path="/organisation/learners" element={<OrganisationLearnersPage />} />
              <Route path="/organisation/learners/:id" element={<OrganisationLearnerDetailPage />} />
              <Route path="/organisation/invoices" element={<OrganisationInvoicesPage />} />
              <Route path="/organisation/invoices/:id" element={<OrganisationInvoiceDetailPage />} />
              <Route path="/organisation/events" element={<OrganisationEventsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["partnerships"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/partnerships/dashboard" element={<PartnershipsDashboardPage />} />
              <Route path="/partnerships/campaigns" element={<PartnershipsCampaignsPage />} />
              <Route path="/partnerships" element={<PartnershipsListPage />} />
              <Route path="/events" element={<TeamEventsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["marketing"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/marketing/dashboard" element={<MarketingDashboardPage />} />
              <Route path="/marketing/campaigns" element={<MarketingCampaignsPage />} />
              <Route path="/events" element={<TeamEventsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["social_media"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/social-media/dashboard" element={<SocialMediaDashboardPage />} />
              <Route path="/social-media/content" element={<SocialMediaContentPage />} />
              <Route path="/events" element={<TeamEventsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ld_manager", "admin"]}><AppLayout /></ProtectedRoute>}>
              <Route path="/ld/dashboard" element={<LDDashboardPage />} />
              <Route path="/ld/tasks" element={<LDTasksPage />} />
              <Route path="/ld/tracks" element={<LDTracksPage />} />
              <Route path="/ld/lesson-plans" element={<LDLessonPlansPage />} />
              <Route path="/ld/coaching" element={<LDCoachingPage />} />
              <Route path="/ld/coaching/:educatorId" element={<LDCoachingDetailPage />} />
              <Route path="/ld/session-reports" element={<LDSessionReportsPage />} />
              <Route path="/ld/session-reports/:id" element={<LDSessionReportDetailPage />} />
              <Route path="/ld/reports" element={<LDReportsPage />} />
              <Route path="/ld/profile" element={<LDProfilePage />} />
              <Route path="/events" element={<TeamEventsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </EventRegistrationsProvider>
        </NotificationsProvider>
        </TasksProvider>
        </CoachingNotesProvider>
        </SocialMediaProvider>
        </MarketingProvider>
        </PartnershipsProvider>
        </LearnerFeedbackProvider>
        </FinanceProvider>
        </InventoryProvider>
        </SessionReportsProvider>
        </AttendanceProvider>
        </BadgeAwardsProvider>
        </SessionExpensesProvider>
        </LessonPlansProvider>
        </ScheduleProvider>
        </EducatorNotesProvider>
        </CoachingInvitesProvider>
        </SessionsProvider>
        </EnrollmentsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
