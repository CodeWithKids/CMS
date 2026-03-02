import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  BarChart2,
  UserCircle,
  ListTodo,
  CalendarDays,
} from "lucide-react";

export const ldManagerNavItems = [
  { label: "Dashboard", to: "/ld/dashboard", iconKey: "dashboard" as const },
  { label: "Tasks", to: "/ld/tasks", iconKey: "tasks" as const },
  { label: "Events", to: "/events", iconKey: "events" as const },
  { label: "Tracks & curriculum", to: "/ld/tracks", iconKey: "tracks" as const },
  { label: "Lesson plan library", to: "/ld/lesson-plans", iconKey: "document" as const },
  { label: "Educator coaching", to: "/ld/coaching", iconKey: "people" as const },
  { label: "Session reports", to: "/ld/session-reports", iconKey: "document" as const },
  { label: "Learning reports", to: "/ld/reports", iconKey: "chart" as const },
  { label: "Profile", to: "/ld/profile", iconKey: "user" as const },
] as const;

export const ldManagerNavIconMap = {
  dashboard: LayoutDashboard,
  tasks: ListTodo,
  events: CalendarDays,
  tracks: BookOpen,
  document: FileText,
  people: Users,
  chart: BarChart2,
  user: UserCircle,
} as const;
