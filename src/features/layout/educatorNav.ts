import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  UserCircle,
  Wallet,
  Package,
} from "lucide-react";

export const educatorNavItems = [
  { label: "Dashboard", to: "/educator/dashboard", iconKey: "dashboard" as const },
  { label: "Schedule", to: "/educator/schedule", iconKey: "calendar" as const },
  { label: "Team schedules", to: "/educator/team-schedule", iconKey: "team" as const },
  { label: "Profile", to: "/educator/profile", iconKey: "user" as const },
  { label: "Earnings", to: "/educator/earnings", iconKey: "earnings" as const },
  { label: "Inventory", to: "/inventory", iconKey: "inventory" as const },
] as const;

export const educatorNavIconMap = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  team: CalendarDays,
  user: UserCircle,
  earnings: Wallet,
  inventory: Package,
} as const;
