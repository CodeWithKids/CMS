import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTerms } from "@/hooks/useTerms";
import { mockSessions, mockUsers, getEducatorName } from "@/mockData";
import { isApiEnabled, sessionsGetAll, type SessionApi } from "@/lib/api";
import type { Session, SessionType, LearningTrack } from "@/types";
import {
  calculateEducatorHoursByTerm,
  filterEducatorHoursByTerm,
  type EducatorHoursSummary,
} from "@/utils/educatorHours";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, Users, BookOpen, Search } from "lucide-react";

function formatHours(h: number): string {
  return h % 1 === 0 ? h.toFixed(0) : h.toFixed(1);
}

export default function EducatorHoursPage() {
  const { terms: termOptions, currentTerm } = useTerms();
  const [selectedTermId, setSelectedTermId] = useState("");
  const [educatorSearch, setEducatorSearch] = useState("");

  useEffect(() => {
    if (termOptions.length === 0) return;
    if (!termOptions.some((t) => t.id === selectedTermId)) setSelectedTermId(currentTerm?.id ?? termOptions[0].id ?? "");
  }, [termOptions, currentTerm, selectedTermId]);

  const termSelectValue = termOptions.length > 0 ? (termOptions.some((t) => t.id === selectedTermId) ? selectedTermId : termOptions[0].id) : "";

  const apiEnabled = isApiEnabled();
  const { data: apiSessions = [] } = useQuery({
    queryKey: ["admin", "educator-hours", "sessions"],
    queryFn: () => sessionsGetAll({}),
    enabled: apiEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const sessions: Session[] = useMemo(
    () =>
      apiEnabled
        ? apiSessions.map(
            (s: SessionApi): Session => ({
              id: s.id,
              classId: s.classId,
              date: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
              topic: s.topic,
              sessionType: s.sessionType as SessionType,
              duration: "1_hour",
              learningTrack: s.learningTrack as LearningTrack,
              termId: s.termId,
              leadEducatorId: s.leadEducatorId,
              assistantEducatorIds: s.assistantEducatorIds ?? [],
              durationHours: s.durationHours ?? 1,
            })
          )
        : mockSessions,
    [apiEnabled, apiSessions]
  );

  const allSummaries = useMemo(
    () => calculateEducatorHoursByTerm(sessions),
    [sessions]
  );

  const termSummaries = useMemo(
    () => filterEducatorHoursByTerm(allSummaries, selectedTermId),
    [allSummaries, selectedTermId]
  );

  const educatorIdsWithRole = useMemo(
    () => new Set(mockUsers.filter((u) => u.role === "educator").map((u) => u.id)),
    []
  );

  const filteredRows = useMemo(() => {
    let rows = termSummaries.filter((s) => educatorIdsWithRole.has(s.educatorId));
    const q = educatorSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((s) =>
        getEducatorName(s.educatorId).toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => getEducatorName(a.educatorId).localeCompare(getEducatorName(b.educatorId)));
  }, [termSummaries, educatorIdsWithRole, educatorSearch]);

  const termTotals = useMemo(() => {
    let totalLead = 0;
    let totalCoaching = 0;
    for (const s of termSummaries) {
      totalLead += s.leadHours;
      totalCoaching += s.coachingHours;
    }
    return {
      totalLead,
      totalCoaching,
      totalTeaching: totalLead + totalCoaching,
    };
  }, [termSummaries]);

  const selectedTerm = termOptions.find((t) => t.id === selectedTermId);

  return (
    <div className="space-y-6">
      <h1 className="page-title flex items-center gap-2">
        <Clock className="w-7 h-7" /> Educator hours
      </h1>
      <p className="page-subtitle">
        Teaching hours by educator per term (lead vs coaching). Data from sessions.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={termSelectValue} onValueChange={setSelectedTermId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {termOptions.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by educator name..."
            value={educatorSearch}
            onChange={(e) => setEducatorSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Total lead hours (this term)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatHours(termTotals.totalLead)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Total coaching hours (this term)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatHours(termTotals.totalCoaching)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total teaching hours (this term)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatHours(termTotals.totalTeaching)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hours by educator</CardTitle>
          <CardDescription>
            {selectedTerm ? selectedTerm.name : "Select a term"}. Lead = led the session; coaching = assisted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No educator hours for this term or no match for the filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Educator</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Lead hours</TableHead>
                  <TableHead className="text-right">Coaching hours</TableHead>
                  <TableHead className="text-right">Total hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <EducatorHoursRow
                    key={`${row.educatorId}-${row.termId}`}
                    row={row}
                    termName={selectedTerm?.name ?? row.termId ?? "—"}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EducatorHoursRow({
  row,
  termName,
}: {
  row: EducatorHoursSummary;
  termName: string;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{getEducatorName(row.educatorId)}</TableCell>
      <TableCell>{termName}</TableCell>
      <TableCell className="text-right">{formatHours(row.leadHours)}</TableCell>
      <TableCell className="text-right">{formatHours(row.coachingHours)}</TableCell>
      <TableCell className="text-right font-medium">{formatHours(row.totalHours)}</TableCell>
    </TableRow>
  );
}
