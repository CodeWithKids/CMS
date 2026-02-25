import { Link } from "react-router-dom";
import { mockClasses, getEducatorName, getTerm } from "@/mockData";
import { Button } from "@/components/ui/button";

export default function ClassesPage() {
  return (
    <div className="page-container">
      <h1 className="page-title">Classes</h1>
      <p className="page-subtitle">All active classes and programs</p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Program</th>
            <th>Age Group</th>
            <th>Location</th>
            <th>Educator</th>
            <th>Term</th>
            <th className="w-[140px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockClasses.map((c) => (
            <tr key={c.id}>
              <td className="font-medium">{c.name}</td>
              <td>{c.program}</td>
              <td>{c.ageGroup}</td>
              <td>{c.location}</td>
              <td>{getEducatorName(c.educatorId)}</td>
              <td>{getTerm(c.termId)?.name ?? c.termId}</td>
              <td>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/classes/${c.id}/enrolments`}>Manage enrolments</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
