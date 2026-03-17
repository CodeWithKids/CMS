import { useState, useEffect, createElement } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Users, BookOpen, LayoutDashboard, Calendar, FileText, Clock,
  GraduationCap, MessageSquare, LogOut, Menu, X,
  UserCircle, Wallet, Receipt, UserPlus, Settings, TrendingUp, ReceiptText, Package, BarChart2, CalendarDays, Megaphone,
  LayoutGrid, FlaskConical, Building2, HelpCircle,
} from "lucide-react";
import type { UserRole } from "@/types";
import { canViewAiMarketing } from "@/features/aiMarketing/permissions";
import { educatorNavItems, educatorNavIconMap } from "@/features/layout/educatorNav";
import { ldManagerNavItems, ldManagerNavIconMap } from "@/features/ld-manager/nav";

type NavEntry =
  | { type: "link"; label: string; path: string; icon: React.ReactNode }
  | { type: "section"; label: string };

const adminNav: NavEntry[] = [
  { type: "link", label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { type: "link", label: "Schedule", path: "/schedule", icon: <Calendar className="w-5 h-5" /> },
  { type: "section", label: "HR" },
  { type: "link", label: "Staff directory", path: "/admin/hr/staff", icon: <UserCircle className="w-5 h-5" /> },
  { type: "link", label: "Team profiles", path: "/admin/educator-profiles", icon: <UserCircle className="w-5 h-5" /> },
  { type: "section", label: "Finance oversight" },
  { type: "link", label: "Salaries", path: "/admin/finance/educator-payments", icon: <Wallet className="w-5 h-5" /> },
  { type: "link", label: "Income", path: "/finance/income", icon: <TrendingUp className="w-5 h-5" /> },
  { type: "link", label: "Expenses", path: "/admin/finance/expenses", icon: <Receipt className="w-5 h-5" /> },
  { type: "section", label: "System setup" },
  { type: "link", label: "Account approvals", path: "/admin/account-approvals", icon: <UserPlus className="w-5 h-5" /> },
  { type: "link", label: "Create account", path: "/admin/create-team-member", icon: <Users className="w-5 h-5" /> },
  { type: "link", label: "Settings", path: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
  { type: "section", label: "Partners" },
  { type: "link", label: "Partners", path: "/partnerships", icon: <Building2 className="w-5 h-5" /> },
  { type: "link", label: "Learners", path: "/admin/learners", icon: <Users className="w-5 h-5" /> },
  { type: "link", label: "Classes", path: "/admin/classes", icon: <BookOpen className="w-5 h-5" /> },
  { type: "link", label: "Session reports", path: "/admin/session-reports", icon: <FileText className="w-5 h-5" /> },
  { type: "link", label: "Schedules", path: "/admin/schedules", icon: <Calendar className="w-5 h-5" /> },
  { type: "link", label: "Inventory", path: "/inventory", icon: <Package className="w-5 h-5" /> },
  { type: "link", label: "Events", path: "/events", icon: <CalendarDays className="w-5 h-5" /> },
];

const financeNav: NavEntry[] = [
  { type: "link", label: "Dashboard", path: "/finance/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { type: "link", label: "Schedule", path: "/schedule", icon: <Calendar className="w-5 h-5" /> },
  { type: "link", label: "Invoices", path: "/finance/invoices", icon: <FileText className="w-5 h-5" /> },
  { type: "link", label: "Adjustments", path: "/finance/adjustments", icon: <TrendingUp className="w-5 h-5" /> },
  { type: "link", label: "Educators", path: "/finance/educators", icon: <Users className="w-5 h-5" /> },
  { type: "link", label: "Inventory", path: "/finance/inventory", icon: <Package className="w-5 h-5" /> },
  { type: "link", label: "Reports", path: "/finance/reports", icon: <BarChart2 className="w-5 h-5" /> },
  { type: "link", label: "Educator payments", path: "/finance/educator-payments", icon: <Wallet className="w-5 h-5" /> },
  { type: "link", label: "Session expenses", path: "/finance/session-expenses", icon: <ReceiptText className="w-5 h-5" /> },
  { type: "link", label: "Session reports", path: "/admin/session-reports", icon: <FileText className="w-5 h-5" /> },
  { type: "link", label: "Income", path: "/finance/income", icon: <TrendingUp className="w-5 h-5" /> },
  { type: "link", label: "Expenses", path: "/finance/expenses", icon: <Receipt className="w-5 h-5" /> },
  { type: "link", label: "Year overview", path: "/finance/year-overview", icon: <BarChart2 className="w-5 h-5" /> },
  { type: "link", label: "Events", path: "/events", icon: <CalendarDays className="w-5 h-5" /> },
];

const educatorNav: NavEntry[] = educatorNavItems.map((item) => ({
  type: "link" as const,
  label: item.label,
  path: item.to,
  icon: createElement(educatorNavIconMap[item.iconKey], { className: "w-5 h-5" }),
}));

const ldManagerNav: NavEntry[] = ldManagerNavItems.map((item) => ({
  type: "link" as const,
  label: item.label,
  path: item.to,
  icon: createElement(ldManagerNavIconMap[item.iconKey], { className: "w-5 h-5" }),
}));

const navByRole: Record<UserRole, NavEntry[]> = {
  admin: adminNav,
  finance: financeNav,
  educator: educatorNav,
  student: [
    { type: "link", label: "Dashboard", path: "/student/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "Profile", path: "/student/profile", icon: <UserCircle className="w-5 h-5" /> },
    { type: "link", label: "Timetable", path: "/student/timetable", icon: <Calendar className="w-5 h-5" /> },
    { type: "link", label: "Resources", path: "/student/resources", icon: <GraduationCap className="w-5 h-5" /> },
    { type: "link", label: "Feedback", path: "/student/feedback", icon: <MessageSquare className="w-5 h-5" /> },
  ],
  parent: [
    { type: "link", label: "Dashboard", path: "/parent/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "Invoices", path: "/parent/invoices", icon: <FileText className="w-5 h-5" /> },
    { type: "link", label: "Events", path: "/parent/events", icon: <Calendar className="w-5 h-5" /> },
  ],
  organisation: [
    { type: "link", label: "Dashboard", path: "/organisation/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "Our learners", path: "/organisation/learners", icon: <Users className="w-5 h-5" /> },
    { type: "link", label: "Invoices & receipts", path: "/organisation/invoices", icon: <FileText className="w-5 h-5" /> },
    { type: "link", label: "Events", path: "/organisation/events", icon: <Calendar className="w-5 h-5" /> },
  ],
  partnerships: [
    { type: "link", label: "Dashboard", path: "/partnerships/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "Schedule", path: "/schedule", icon: <Calendar className="w-5 h-5" /> },
    { type: "section", label: "Partners" },
    { type: "link", label: "Partners", path: "/partnerships", icon: <Building2 className="w-5 h-5" /> },
    { type: "link", label: "Prospects", path: "/partnerships/prospects", icon: <UserPlus className="w-5 h-5" /> },
    { type: "link", label: "Grants & funding", path: "/partnerships/grants", icon: <Wallet className="w-5 h-5" /> },
    { type: "link", label: "Campaigns linked to partnerships", path: "/partnerships/campaigns", icon: <Megaphone className="w-5 h-5" /> },
    { type: "link", label: "Events", path: "/events", icon: <CalendarDays className="w-5 h-5" /> },
  ],
  marketing: [
    { type: "link", label: "Overview", path: "/marketing/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "Schedule", path: "/schedule", icon: <Calendar className="w-5 h-5" /> },
    { type: "link", label: "Events", path: "/events", icon: <CalendarDays className="w-5 h-5" /> },
    { type: "link", label: "Campaigns", path: "/marketing/campaigns", icon: <Megaphone className="w-5 h-5" /> },
    { type: "link", label: "Brand Kit", path: "/marketing/brand-kit", icon: <BookOpen className="w-5 h-5" /> },
    { type: "link", label: "Profile", path: "/marketing/profile", icon: <UserCircle className="w-5 h-5" /> },
  ],
  social_media: [
    { type: "link", label: "Dashboard", path: "/social-media/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "Schedule", path: "/schedule", icon: <Calendar className="w-5 h-5" /> },
    { type: "link", label: "Content & posts", path: "/social-media/content", icon: <Megaphone className="w-5 h-5" /> },
    { type: "link", label: "Analytics", path: "/social-media/analytics", icon: <BarChart2 className="w-5 h-5" /> },
    { type: "link", label: "Brand Kit", path: "/marketing/brand-kit", icon: <BookOpen className="w-5 h-5" /> },
    { type: "link", label: "Events", path: "/events", icon: <CalendarDays className="w-5 h-5" /> },
    { type: "link", label: "Profile", path: "/social-media/profile", icon: <UserCircle className="w-5 h-5" /> },
  ],
  ld_manager: ldManagerNav,
};

const aiMarketingNav: NavEntry[] = [
  { type: "section", label: "AI Marketing" },
  { type: "link", label: "Overview", path: "/ai-marketing/overview", icon: <LayoutDashboard className="w-5 h-5" /> },
  { type: "link", label: "Canvas", path: "/ai-marketing/canvas", icon: <LayoutGrid className="w-5 h-5" /> },
  { type: "link", label: "Experiments", path: "/ai-marketing/experiments", icon: <FlaskConical className="w-5 h-5" /> },
  { type: "link", label: "Products", path: "/ai-marketing/products", icon: <Package className="w-5 h-5" /> },
];

export default function AppLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile(); // true = mobile, false = desktop, undefined = not yet known
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const useDrawer = isMobile !== false; // treat unknown as mobile so we don't flash desktop layout

  // Desktop: open sidebar by default. Mobile/unknown: keep closed.
  useEffect(() => {
    if (isMobile === false) setSidebarOpen(true);
  }, [isMobile]);

  // On mobile, close sidebar when navigating so user sees the new page full-width.
  useEffect(() => {
    if (isMobile === true) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const baseNav = navByRole[currentUser.role] ?? [];
  const navItems = canViewAiMarketing(currentUser.role)
    ? [...baseNav, ...aiMarketingNav]
    : baseNav;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="h-14 bg-card border-b flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to={getRoleDashboard(currentUser.role)} className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="Code With Kids"
              className="h-8 w-auto object-contain"
            />
            <span className="font-bold text-lg hidden sm:inline">Code With Kids</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-tight">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
          </div>
          <button
            onClick={() => { logout(); }}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Backdrop when sidebar is open on mobile */}
        {useDrawer && sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar: overlay drawer on mobile, inline on desktop */}
        <aside
          className={`
            flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 overflow-hidden shrink-0
            fixed inset-y-0 left-0 z-30 w-56 pt-14 md:pt-0 md:static md:translate-x-0
            ${useDrawer
              ? (sidebarOpen ? "translate-x-0" : "-translate-x-full")
              : (sidebarOpen ? "md:w-56" : "md:w-0")
            }
          `}
        >
          <nav className="p-3 space-y-1 mt-2 flex-1 overflow-auto" onClick={() => useDrawer && setSidebarOpen(false)}>
            {navItems.map((item, i) => {
              if (item.type === "section") {
                const isAdminSection = currentUser.role === "admin";
                return (
                  <div
                    key={`section-${item.label}-${i}`}
                    className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${isAdminSection ? "text-[#F9C846]" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </div>
                );
              }
              const active = location.pathname === item.path || (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3 mt-auto border-t border-sidebar-border/50">
            <a
              href="mailto:codewithkidsafrica@gmail.com?subject=CWK%20Hub%20-%20Report%20a%20problem"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Report a problem</span>
            </a>
          </div>
        </aside>

        {/* Main content: responsive padding and width so all pages work on small screens */}
        <main className="flex-1 min-w-0 overflow-auto bg-background pb-8 md:pb-0">
          <div className="page-container min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
