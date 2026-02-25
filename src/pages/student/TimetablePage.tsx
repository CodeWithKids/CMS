import { getSessionsForStudent, getClass, getEducatorName } from "@/mockData";

export default function TimetablePage() {
  const learnerId = "l1";
  const sessions = getSessionsForStudent(learnerId);

  const sorted = [...sessions].sort((a, b) => {
    const da = `${a.date} ${a.startTime}`;
    const db = `${b.date} ${b.startTime}`;
    return da.localeCompare(db);
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Timetable</h1>
      <p className="page-subtitle">Your upcoming sessions</p>

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
          {sorted.map((s) => {
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
  );
}
