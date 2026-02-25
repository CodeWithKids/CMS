import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useSessionExpenses } from "@/context/SessionExpensesContext";
import { getClass } from "@/mockData";
import { useSessions } from "@/context/SessionsContext";
import { canEditSession, getSessionRoleForUser } from "@/features/educator/lib/auth";
import { AddCoachDialog } from "@/features/educator/components/AddCoachDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SESSION_TYPE_LABELS } from "@/types";

const SCHOOL_ORGANIZATION_OPTIONS = [
  "Code With Kids - Makerspace",
  "Code With Kids - Virtual",
  "Code With Kids - Home Sessions",
  "Light International School",
  "Kokomelon Schools",
  "Kianda School",
  "Vine Garden Academy",
  "KE 916 Kibera",
  "KE 370 Waithaka",
  "KE 462 Limuru",
  "Kangemi Church CDC",
  "Spur Afrika",
  "Smart Kibera of Hope(SKOH)",
  "Maisha Trust",
];
import { ArrowLeft, Receipt, UserPlus } from "lucide-react";

const formSchema = z.object({
  schoolName: z.string().min(1, "School or organisation name is required"),
  transportTo: z.coerce.number().min(0, "Must be ≥ 0"),
  transportFrom: z.coerce.number().min(0, "Must be ≥ 0"),
  otherAmount: z.coerce.number().min(0, "Must be ≥ 0").optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function SessionExpensePage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getExpenseBySessionAndEducator, addExpense, updateExpense } = useSessionExpenses();
  const { getSessionById } = useSessions();
  const [coachDialogOpen, setCoachDialogOpen] = useState(false);

  const session = getSessionById(sessionId ?? "");
  const cls = session ? getClass(session.classId) : undefined;
  const educatorId = currentUser?.role === "educator" ? currentUser.id : "";
  const role = getSessionRoleForUser(session, currentUser);
  const isCoachReadOnly = role === "coach";
  const existing = sessionId && educatorId
    ? getExpenseBySessionAndEducator(sessionId, educatorId)
    : undefined;

  const isMakerspace = session?.sessionType === "makerspace";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolName: existing?.schoolName ?? cls?.name ?? "",
      transportTo: existing?.transportTo ?? 0,
      transportFrom: existing?.transportFrom ?? 0,
      otherAmount: existing?.otherAmount ?? 0,
      notes: existing?.notes ?? "",
    },
  });

  const transportTo = form.watch("transportTo");
  const transportFrom = form.watch("transportFrom");
  const otherAmount = form.watch("otherAmount");
  const totalRequested =
    Number(transportTo) + Number(transportFrom) + (Number(otherAmount) || 0);

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Session not found.</p>
        <Link to="/educator/dashboard" className="text-primary hover:underline text-sm">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (currentUser?.role !== "educator") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Only educators can request session expenses.</p>
      </div>
    );
  }

  const canEdit = !isCoachReadOnly && (!existing || existing.status === "requested");

  function onSubmit(values: FormValues) {
    const transportTo = isMakerspace ? 0 : Number(values.transportTo);
    const transportFrom = isMakerspace ? 0 : Number(values.transportFrom);
    const total =
      transportTo + transportFrom + (Number(values.otherAmount) || 0);

    if (existing) {
      if (existing.status === "requested") {
        updateExpense(existing.id, {
          schoolName: values.schoolName,
          transportTo,
          transportFrom,
          otherAmount: Number(values.otherAmount) || 0,
          totalRequested: total,
          notes: values.notes,
        });
      }
    } else {
      addExpense({
        educatorId,
        sessionId: session.id,
        schoolName: values.schoolName,
        transportTo,
        transportFrom,
        otherAmount: Number(values.otherAmount) || 0,
        totalRequested: total,
        status: "requested",
        requestedAt: new Date().toISOString(),
        notes: values.notes,
      });
    }
    form.reset(values);
  }

  return (
    <div className="p-6 space-y-6">
      <Link
        to={cls ? `/educator/classes/${cls.id}` : "/educator/dashboard"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {cls ? "class" : "dashboard"}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Session summary
          </CardTitle>
          <CardDescription>Expense request for this session.</CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SessionRoleChips session={session} />
            {session && canEditSession(session, currentUser) && !isCoachReadOnly && (
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCoachDialogOpen(true)}>
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Manage coaches
              </Button>
            )}
          </div>
          {session && (
            <AddCoachDialog session={session} open={coachDialogOpen} onOpenChange={setCoachDialogOpen} />
          )}
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Date:</span> {formatDate(session.date)} ·{" "}
            {session.startTime}–{session.endTime}
          </p>
          <p>
            <span className="font-medium">Class:</span> {cls?.name ?? "—"}
          </p>
          <p>
            <span className="font-medium">Type:</span>{" "}
            {SESSION_TYPE_LABELS[session.sessionType]}
          </p>
          <p>
            <span className="font-medium">Topic:</span> {session.topic}
          </p>
          {existing && (
            <p className="pt-2 text-muted-foreground">
              Status: <span className="capitalize font-medium">{existing.status}</span>
              {existing.status !== "requested" && " — no further edits allowed."}
            </p>
          )}
        </CardContent>
      </Card>

      {isCoachReadOnly && (
        <div className="p-3 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
          Only the facilitator can edit expenses for this session. You can view the summary above.
        </div>
      )}

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Expense request</CardTitle>
            <CardDescription>
              Transport and other costs for this session. Total is calculated automatically.
            </CardDescription>
            {isMakerspace && (
              <p className="text-sm text-muted-foreground rounded-md bg-muted/60 px-3 py-2 mt-2">
                Makerspace sessions happen at the office – no transport.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School / organisation name</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select school or organisation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SCHOOL_ORGANIZATION_OPTIONS.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transportTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transport to (Ksh)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          disabled={isMakerspace}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transportFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transport from (Ksh)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          disabled={isMakerspace}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other amount (Ksh, optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-lg border bg-muted/50 px-4 py-3">
                  <p className="text-sm font-medium">
                    Total requested: Ksh {totalRequested.toLocaleString()}
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g. Taxi, parking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">
                  {existing ? "Update request" : "Submit request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              This expense has been {existing?.status} and can no longer be edited.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
