import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  UserCircle,
  Wallet,
  Package,
  MessageSquare,
  ListTodo,
  Mail,
} from "lucide-react";

export const educatorNavItems = [
  { label: "Dashboard", to: "/educator/dashboard", iconKey: "dashboard" as const },
  { label: "Schedule", to: "/educator/schedule", iconKey: "calendar" as const },
  { label: "Coaching invites", to: "/educator/coaching-invites", iconKey: "coachingInvites" as const },
  { label: "Tasks", to: "/educator/tasks", iconKey: "tasks" as const },
  { label: "Events", to: "/events", iconKey: "events" as const },
  { label: "Learner feedback", to: "/educator/learner-feedback", iconKey: "feedback" as const },
  { label: "Profile", to: "/educator/profile", iconKey: "user" as const },
  { label: "Earnings", to: "/educator/earnings", iconKey: "earnings" as const },
  { label: "Inventory", to: "/inventory", iconKey: "inventory" as const },
] as const;

export const educatorNavIconMap = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  coachingInvites: Mail,
  events: CalendarDays,
  tasks: ListTodo,
  feedback: MessageSquare,
  user: UserCircle,
  earnings: Wallet,
  inventory: Package,
} as const;
