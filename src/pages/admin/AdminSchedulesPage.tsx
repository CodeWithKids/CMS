import { useState, useMemo } from "react";
import { useSchedule } from "@/context/ScheduleContext";
import { useSessions } from "@/context/SessionsContext";
import { getClass } from "@/mockData";
import { mockUsers } from "@/mockData";
import { LEARNING_TRACK_LABELS } from "@/types";
import type { Session } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

function getWeekDates(ref: Date): Date[] {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const educators = mockUsers.filter((u) => u.role === "educator");
const ALL_ID = "__all__";

export default function AdminSchedulesPage() {
  const { getSlotsForEducator } = useSchedule();
  const { sessions, getSessionsForEducatorByRole } = useSessions();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const m = new Date(d);
    m.setDate(diff);
    return m.toISOString().split("T")[0];
  });
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>(ALL_ID);

  const weekDates = useMemo(() => getWeekDates(new Date(weekStart)), [weekStart]);
  const start = weekDates[0].toISOString().split("T")[0];
  const end = weekDates[6].toISOString().split("T")[0];

  const sessionsInWeek = useMemo(() => {
    if (selectedEducatorId === ALL_ID) {
      return sessions.filter((s) => s.date >= start && s.date <= end).sort((a, b) => a.date.localeCompare(b.date));
    }
    return getSessionsForEducatorByRole(selectedEducatorId, { from: start, to: end });
  }, [selectedEducatorId, start, end, sessions, getSessionsForEducatorByRole]);

  const slots = useMemo(() => {
    if (selectedEducatorId === ALL_ID) return [];
    return getSlotsForEducator(selectedEducatorId);
  }, [selectedEducatorId, getSlotsForEducator]);

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2">
        <Calendar className="w-6 h-6" /> Schedules
      </h1>
      <p className="page-subtitle text-muted-foreground mb-4">
        View educator availability and sessions. Select an educator or All to see the week grid.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <Label className="text-sm">Educator</Label>
          <Select value={selectedEducatorId} onValueChange={setSelectedEducatorId}>
            <SelectTrigger className="w-[220px] mt-1">
              <SelectValue placeholder="Select educator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ID}>All educators</SelectItem>
              {educators.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Week starting</Label>
          <Input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-[160px] mt-1"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Week view</CardTitle>
          <CardDescription>
            {selectedEducatorId === ALL_ID
              ? "Sessions for all educators"
              : educators.find((e) => e.id === selectedEducatorId)?.name}{" "}
            · {weekDates[0].toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} –{" "}
            {weekDates[6].toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-2 w-14 text-left bg-muted/50">Time</th>
                  {DAY_LABELS.map((label, i) => (
                    <th key={i} className="border p-2 min-w-[120px] bg-muted/50">
                      {label} {weekDates[i].getDate()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <td className="border p-1 text-muted-foreground w-14">{hour}:00</td>
                    {weekDates.map((date, dayIndex) => {
                      const dateKey = toDateKey(date);
                      const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
                      const cellSlots =
                        selectedEducatorId === ALL_ID
                          ? []
                          : slots.filter(
                              (s) =>
                                s.dayOfWeek === dayOfWeek &&
                                timeToMinutes(s.startTime) < (hour + 1) * 60 &&
                                timeToMinutes(s.endTime) > hour * 60
                            );
                      const cellSessions = sessionsInWeek.filter(
                        (s) =>
                          s.date === dateKey &&
                          timeToMinutes(s.startTime) < (hour + 1) * 60 &&
                          timeToMinutes(s.endTime) > hour * 60
                      );
                      return (
                        <td key={dayIndex} className="border p-1 align-top min-w-[120px]">
                          {cellSessions.map((s) => {
                            const cls = getClass(s.classId);
                            const leadName = educators.find((u) => u.id === s.leadEducatorId)?.name ?? "—";
                            const coachNames = (s.assistantEducatorIds ?? [])
                              .map((id) => educators.find((u) => u.id === id)?.name)
                              .filter(Boolean);
                            return (
                              <div
                                key={s.id}
                                className="mb-1 rounded px-2 py-1 text-xs bg-primary/15 border border-primary/30"
                              >
                                <span className="font-medium">{cls?.name ?? s.classId}</span>
                                <span className="block text-muted-foreground">
                                  {s.startTime}–{s.endTime} · {LEARNING_TRACK_LABELS[s.learningTrack] ?? s.learningTrack}
                                </span>
                                {selectedEducatorId === ALL_ID && (
                                  <span className="block mt-0.5 text-[10px] text-muted-foreground">
                                    Lead: {leadName}
                                    {coachNames.length > 0 && ` · Coaches: ${coachNames.join(", ")}`}
                                  </span>
                                )}
                                {selectedEducatorId !== ALL_ID && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] bg-muted">
                                    {s.leadEducatorId === selectedEducatorId ? "Facilitator" : "Coach"}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {cellSlots.map((slot) => (
                            <div key={slot.id} className="mb-1 rounded px-2 py-1 text-xs bg-muted">
                              {slot.startTime}–{slot.endTime} {slot.type}
                              {slot.note && ` · ${slot.note}`}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
