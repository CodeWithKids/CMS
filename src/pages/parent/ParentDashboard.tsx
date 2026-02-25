import { useAuth } from "@/context/AuthContext";
import { parentChildMap, getLearner, getTodaySessionsForStudent, getClass } from "@/mockData";
import { User, Clock } from "lucide-react";

export default function ParentDashboard() {
  const { currentUser } = useAuth();
  const parentId = currentUser?.id ?? "u5";
  const childIds = parentChildMap[parentId] ?? [];

  return (
    <div className="page-container">
      <h1 className="page-title">Parent Dashboard</h1>
      <p className="page-subtitle">Welcome, {currentUser?.name}</p>

      <div className="grid gap-6 md:grid-cols-2">
        {childIds.map((childId) => {
          const learner = getLearner(childId);
          if (!learner) return null;
          const todaySessions = getTodaySessionsForStudent(childId);

          return (
            <div key={childId} className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{learner.firstName} {learner.lastName}</p>
                  <p className="text-xs text-muted-foreground">{learner.school}</p>
                </div>
              </div>

              {/* Attendance summary (mocked) */}
              <div className="p-3 rounded-lg bg-muted/50 mb-3">
                <p className="text-sm font-medium">Attendance: 8/10 sessions</p>
                <div className="w-full h-2 bg-muted rounded-full mt-1">
                  <div className="h-2 bg-success rounded-full" style={{ width: "80%" }} />
                </div>
              </div>

              {/* Next session */}
              <h3 className="font-medium text-sm flex items-center gap-1 mb-2">
                <Clock className="w-4 h-4 text-accent" /> Today's Sessions
              </h3>
              {todaySessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sessions today.</p>
              ) : (
                <div className="space-y-2">
                  {todaySessions.map((s) => {
                    const cls = getClass(s.classId);
                    return (
                      <div key={s.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <span className="font-medium">{cls?.name}</span> · {s.startTime} – {s.endTime}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {childIds.length === 0 && (
          <p className="text-muted-foreground">No children linked to your account.</p>
        )}
      </div>
    </div>
  );
}
