import { useNavigate } from "react-router-dom";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useAttendance } from "@/context/AttendanceContext";
import { getSession, getClass, getEducatorName } from "@/mockData";
import { buildSessionReportSummary } from "@/lib/sessionReportAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";

function presentCountForSession(sessionId: string, getBySession: (id: string) => { status: string }[]): number {
  const records = getBySession(sessionId);
  return records.filter((r) => r.status === "present" || r.status === "late").length;
}

export default function LDSessionReportsPage() {
  const navigate = useNavigate();
  const { list, getBySession } = useSessionReports();
  const { getBySession: getAttendanceBySession } = useAttendance();

  const summaries = list().map((r) =>
    buildSessionReportSummary(r, getSession, getClass, getEducatorName, presentCountForSession(r.sessionId, getAttendanceBySession))
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6" /> Session reports
        </h1>
        <p className="text-muted-foreground">View session reports (read-only). Use for quality and coaching.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Submitted session reports across tracks</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Session / class</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No reports.</TableCell>
                </TableRow>
              ) : (
                summaries.map((row) => (
                  <TableRow key={row.reportId}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.className ?? row.sessionId}</TableCell>
                    <TableCell>{row.leadEducatorName}</TableCell>
                    <TableCell>{row.sessionType}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-primary text-sm hover:underline"
                        onClick={() => navigate(`/ld/session-reports/${row.id}`)}
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
