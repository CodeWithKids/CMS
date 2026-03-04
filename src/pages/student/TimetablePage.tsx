import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getSessionsForStudent, getClass, getEducatorName, getLearnerByUserId } from "@/mockData";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

export default function TimetablePage() {
  const { currentUser } = useAuth();
  const learner = currentUser?.role === "student" && currentUser?.id ? getLearnerByUserId(currentUser.id) : null;
  const learnerId = learner?.id ?? null;
  const sessions = learnerId ? getSessionsForStudent(learnerId) : [];
  const upcoming = [...sessions].filter((s) => s.date >= today).sort((a, b) => {
    const da = `${a.date} ${a.startTime}`;
    const db = `${b.date} ${b.startTime}`;
    return da.localeCompare(db);
  });

  if (currentUser?.role !== "student") {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Only students can view the timetable.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/student/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Timetable</h1>
      <p className="page-subtitle">Your upcoming sessions. Dates and times may be updated by your educator.</p>

      {upcoming.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center max-w-md">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No upcoming sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            When your educator schedules sessions for your class, they will appear here.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/student/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Class</th>
                <th>Educator</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((s) => {
                const cls = getClass(s.classId);
                return (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td>{s.startTime} – {s.endTime}</td>
                    <td className="font-medium">{cls?.name ?? "—"}</td>
                    <td>{cls ? getEducatorName(cls.educatorId) : "—"}</td>
                    <td>{cls?.location ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
