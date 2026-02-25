import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/context/AuthContext";
import {
  Users, BookOpen, LayoutDashboard, Calendar, FileText, Clock,
  GraduationCap, MessageSquare, LogOut, Menu, X, Code,
  UserCircle, Wallet, Receipt, UserPlus, Settings, TrendingUp, ReceiptText, Package, BarChart2, Laptop, CalendarDays,
} from "lucide-react";
import type { UserRole } from "@/types";

type NavEntry =
  | { type: "link"; label: string; path: string; icon: React.ReactNode }
  | { type: "section"; label: string };

const adminNav: NavEntry[] = [
  { type: "link", label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { type: "section", label: "HR" },
  { type: "link", label: "Staff directory", path: "/admin/hr/staff", icon: <UserCircle className="w-5 h-5" /> },
  { type: "section", label: "Finance oversight" },
  { type: "link", label: "Educator payments", path: "/admin/finance/educator-payments", icon: <Wallet className="w-5 h-5" /> },
  { type: "link", label: "Educator hours", path: "/admin/educator-hours", icon: <Clock className="w-5 h-5" /> },
  { type: "link", label: "Expenses", path: "/admin/finance/expenses", icon: <Receipt className="w-5 h-5" /> },
  { type: "section", label: "System setup" },
  { type: "link", label: "Account approvals", path: "/admin/account-approvals", icon: <UserPlus className="w-5 h-5" /> },
  { type: "link", label: "Settings", path: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
  { type: "link", label: "Learners", path: "/admin/learners", icon: <Users className="w-5 h-5" /> },
  { type: "link", label: "Classes", path: "/admin/classes", icon: <BookOpen className="w-5 h-5" /> },
  { type: "link", label: "Session reports", path: "/admin/session-reports", icon: <FileText className="w-5 h-5" /> },
  { type: "link", label: "Schedules", path: "/admin/schedules", icon: <Calendar className="w-5 h-5" /> },
  { type: "link", label: "Inventory", path: "/inventory", icon: <Package className="w-5 h-5" /> },
];

const financeNav: NavEntry[] = [
  { type: "link", label: "Dashboard", path: "/finance/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { type: "link", label: "Educator payments", path: "/finance/educator-payments", icon: <Wallet className="w-5 h-5" /> },
  { type: "link", label: "Session expenses", path: "/finance/session-expenses", icon: <ReceiptText className="w-5 h-5" /> },
  { type: "link", label: "Session reports", path: "/admin/session-reports", icon: <FileText className="w-5 h-5" /> },
  { type: "link", label: "Income", path: "/finance/income", icon: <TrendingUp className="w-5 h-5" /> },
  { type: "link", label: "Expenses", path: "/finance/expenses", icon: <Receipt className="w-5 h-5" /> },
  { type: "link", label: "Year overview", path: "/finance/year-overview", icon: <BarChart2 className="w-5 h-5" /> },
];

const navByRole: Record<UserRole, NavEntry[]> = {
  admin: adminNav,
  finance: financeNav,
  educator: [
    { type: "link", label: "Dashboard", path: "/educator/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "My classes", path: "/educator/dashboard", icon: <BookOpen className="w-5 h-5" /> },
    { type: "link", label: "My devices", path: "/educator/dashboard", icon: <Laptop className="w-5 h-5" /> },
    { type: "link", label: "Schedule", path: "/educator/schedule", icon: <Calendar className="w-5 h-5" /> },
    { type: "link", label: "Team schedules", path: "/educator/team-schedule", icon: <CalendarDays className="w-5 h-5" /> },
    { type: "link", label: "Profile", path: "/educator/profile", icon: <UserCircle className="w-5 h-5" /> },
    { type: "link", label: "Earnings", path: "/educator/earnings", icon: <Wallet className="w-5 h-5" /> },
    { type: "link", label: "Inventory", path: "/inventory", icon: <Package className="w-5 h-5" /> },
  ],
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
  ],
  organisation: [
    { type: "link", label: "Dashboard", path: "/organisation/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { type: "link", label: "Our learners", path: "/organisation/learners", icon: <Users className="w-5 h-5" /> },
  ],
};

export default function AppLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!currentUser) return null;

  const navItems = navByRole[currentUser.role] ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="h-14 bg-card border-b flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to={getRoleDashboard(currentUser.role)} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Code className="w-5 h-5 text-primary-foreground" />
            </div>
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

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "w-56" : "w-0"} bg-sidebar text-sidebar-foreground transition-all duration-200 overflow-hidden shrink-0`}
        >
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item, i) => {
              if (item.type === "section") {
                return (
                  <div
                    key={`section-${item.label}-${i}`}
                    className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
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
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
