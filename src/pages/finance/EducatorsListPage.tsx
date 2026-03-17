import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSessions } from "@/context/SessionsContext";
import { useTerms } from "@/hooks/useTerms";
import { mockUsers, getEducatorName } from "@/mockData";
import {
  calculateEducatorHoursByTerm,
  filterEducatorHoursByTerm,
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
import { Users, Clock, Search } from "lucide-react";

function formatHours(h: number): string {
  return h % 1 === 0 ? h.toFixed(0) : h.toFixed(1);
}

export default function EducatorsListPage() {
  const { terms: termOptions, currentTerm } = useTerms();
  const [termId, setTermId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (termOptions.length === 0) return;
    if (!termOptions.some((t) => t.id === termId)) setTermId(currentTerm?.id ?? termOptions[0].id ?? "");
  }, [termOptions, currentTerm, termId]);

  const termSelectValue = termOptions.length > 0 ? (termOptions.some((t) => t.id === termId) ? termId : termOptions[0].id) : "";

  const { sessions } = useSessions();

  const allSummaries = useMemo(
    () => calculateEducatorHoursByTerm(sessions),
    [sessions]
  );

  const termSummaries = useMemo(
    () => filterEducatorHoursByTerm(allSummaries, termId),
    [allSummaries, termId]
  );

  const educatorIds = useMemo(
    () => new Set(mockUsers.filter((u) => u.role === "educator").map((u) => u.id)),
    []
  );

  const rows = useMemo(() => {
    let list = termSummaries.filter((s) => educatorIds.has(s.educatorId));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) =>
        getEducatorName(e.educatorId).toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) =>
      getEducatorName(a.educatorId).localeCompare(getEducatorName(b.educatorId))
    );
  }, [termSummaries, educatorIds, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Educator hours & earnings</h1>
        <p className="text-muted-foreground">
          Facilitating and coaching hours by educator for the selected term. Use for stipends and budgeting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Educators
          </CardTitle>
          <CardDescription>
            Select a term and search by name. Click a row for full detail and optional expense summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select value={termSelectValue} onValueChange={setTermId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Term" />
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
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">
              No educators found for this term or search.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Centre / role</TableHead>
                  <TableHead className="text-right">Facilitating (h)</TableHead>
                  <TableHead className="text-right">Coaching (h)</TableHead>
                  <TableHead className="text-right">Total (h)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.educatorId}>
                    <TableCell className="font-medium">
                      {getEducatorName(row.educatorId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      Educator
                    </TableCell>
                    <TableCell className="text-right">{formatHours(row.leadHours)}</TableCell>
                    <TableCell className="text-right">{formatHours(row.coachingHours)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatHours(row.totalHours)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/finance/educators/${row.educatorId}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
