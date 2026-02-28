import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSessions } from "@/context/SessionsContext";
import { useSessionExpenses } from "@/context/SessionExpensesContext";
import { mockTerms, getEducatorName, getClass } from "@/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserCircle, Clock, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/financeUtils";

function formatHours(h: number): string {
  return h % 1 === 0 ? h.toFixed(0) : h.toFixed(1);
}

export default function EducatorFinanceDetailPage() {
  const { id: educatorId } = useParams<{ id: string }>();
  const [termId, setTermId] = useState(mockTerms[0]?.id ?? "t1");

  const { getSessionsForEducatorByRole } = useSessions();
  const { expenses: allExpenses } = useSessionExpenses();

  const sessionsInTerm = useMemo(() => {
    if (!educatorId) return [];
    const term = mockTerms.find((t) => t.id === termId);
    if (!term) return [];
    return getSessionsForEducatorByRole(educatorId, {
      from: term.startDate,
      to: term.endDate,
    });
  }, [educatorId, termId, getSessionsForEducatorByRole]);

  const hours = useMemo(() => {
    let facilitating = 0;
    let coaching = 0;
    for (const s of sessionsInTerm) {
      const h = s.durationHours ?? 1;
      if (s.leadEducatorId === educatorId) facilitating += h;
      else coaching += h;
    }
    return { facilitating, coaching, total: facilitating + coaching };
  }, [sessionsInTerm, educatorId]);

  const sessionCount = sessionsInTerm.length;
  const classCount = useMemo(
    () => new Set(sessionsInTerm.map((s) => s.classId)).size,
    [sessionsInTerm]
  );

  const expenses = useMemo(() => {
    if (!educatorId) return [];
    return allExpenses.filter((e) => e.educatorId === educatorId);
  }, [educatorId, allExpenses]);

  const expensesInTerm = useMemo(() => {
    const term = mockTerms.find((t) => t.id === termId);
    if (!term) return expenses;
    return expenses.filter((e) => {
      const session = sessionsInTerm.find((s) => s.id === e.sessionId);
      return session != null;
    });
  }, [expenses, termId, sessionsInTerm]);

  const totalRequested = useMemo(
    () => expensesInTerm.reduce((s, e) => s + e.totalRequested, 0),
    [expensesInTerm]
  );

  if (!educatorId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Educator not found.</p>
        <Link to="/finance/educators" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to educators
        </Link>
      </div>
    );
  }

  const term = mockTerms.find((t) => t.id === termId);

  return (
    <div className="p-6 space-y-6">
      <Link
        to="/finance/educators"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to educators
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" /> {getEducatorName(educatorId)}
          </CardTitle>
          <CardDescription>Finance summary: hours and session expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              {mockTerms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Facilitating hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatHours(hours.facilitating)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coaching hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatHours(hours.coaching)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sessionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{classCount}</p>
          </CardContent>
        </Card>
      </div>

      {expensesInTerm.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Session expenses ({term?.name ?? termId})
            </CardTitle>
            <CardDescription>
              Expenses logged for sessions in this term. Total requested: {formatCurrency(totalRequested)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {expensesInTerm.map((e) => {
                const session = sessionsInTerm.find((s) => s.id === e.sessionId);
                const cls = session ? getClass(session.classId) : null;
                return (
                  <li key={e.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-muted-foreground">
                      {cls?.name ?? e.sessionId} · {e.schoolName}
                    </span>
                    <span className="font-medium">{formatCurrency(e.totalRequested)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Export for payroll can be added here (e.g. CSV).
            </p>
          </CardContent>
        </Card>
      )}

      {expensesInTerm.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">No session expenses in this term.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
