import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getTodaySessionsForStudent, getClass, getEducatorName, mockEvents, getLearnerByUserId } from "@/mockData";
import { Clock, Calendar, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const platformLinks = [
  { name: "Scratch", url: "https://scratch.mit.edu", color: "bg-amber-500" },
  { name: "Typing.com", url: "https://www.typing.com", color: "bg-blue-500" },
  { name: "Tinkercad", url: "https://www.tinkercad.com", color: "bg-teal-500" },
  { name: "Roblox", url: "https://www.roblox.com/create", color: "bg-red-500" },
  { name: "PyGolfers", url: "https://www.pygolfers.com", color: "bg-green-600" },
];

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const learner = currentUser?.role === "student" && currentUser?.id ? getLearnerByUserId(currentUser.id) : null;
  const learnerId = learner?.id ?? null;

  const todaySessions = learnerId ? getTodaySessionsForStudent(learnerId) : [];
  const studentEvents = mockEvents.filter((e) => e.target === "students");

  const needsAvatar = currentUser?.role === "student" && !currentUser?.avatarId;

  return (
    <div className="page-container">
      <h1 className="page-title">Student Dashboard</h1>
      <p className="page-subtitle">Welcome back, {currentUser?.name}! 🚀</p>

      {needsAvatar && (
        <div className="mb-6 p-4 rounded-xl border bg-primary/5 border-primary/20 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-medium">
            Choose your avatar to complete your profile. Only preset avatars are allowed (no photo uploads).
          </p>
          <Button asChild size="sm">
            <Link to="/student/profile" className="inline-flex items-center gap-2">
              <User className="w-4 h-4" /> Choose avatar
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Sessions */}
        <div className="bg-card rounded-xl border p-5 md:col-span-2 lg:col-span-1">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-accent" /> Today's Sessions
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions today. Enjoy your day! 🎉</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s) => {
                const cls = getClass(s.classId);
                return (
                  <div key={s.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm">{cls?.name}</p>
                    <p className="text-xs text-muted-foreground">{s.startTime} – {s.endTime}</p>
                    <p className="text-xs text-muted-foreground">{s.topic}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-2">
            {platformLinks.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
              >
                <div className={`w-3 h-3 rounded-full ${p.color}`} />
                {p.name}
                <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" /> Upcoming Events
          </h2>
          <div className="space-y-3">
            {studentEvents.map((e) => (
              <div key={e.id} className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} at {e.time}</p>
                <p className="text-xs text-muted-foreground">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
