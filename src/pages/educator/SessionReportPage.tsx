import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useAttendance } from "@/context/AttendanceContext";
import { useSessionReports } from "@/context/SessionReportsContext";
import { useLearnerFeedback } from "@/context/LearnerFeedbackContext";
import { getClass, getLearner, mockUsers } from "@/mockData";
import { useSessions } from "@/context/SessionsContext";
import { SessionRoleChips } from "@/features/educator/components/SessionRoleChips";
import { AddCoachDialog } from "@/features/educator/components/AddCoachDialog";
import { canEditSession } from "@/features/educator/lib/auth";
import {
  SESSION_TYPE_LABELS,
  SESSION_DURATION_LABELS,
  LEARNING_TRACK_LABELS,
} from "@/types";
import type { SessionReport, EngagementLevel, ObjectivesMet } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, FileText, Send, UserPlus, MessageSquare, Star } from "lucide-react";
import { getSessionRoleForUser } from "@/features/educator/lib/auth";

/** Sentinel value for "No coach needed"; filtered out when saving. */
const NO_COACH_VALUE = "__no_coach__";
const MAX_ASSISTANTS = 4;

const HIGHLIGHT_OPTIONS = [
  "Great participation",
  "Finished objectives",
  "Needed more time",
  "Technical issues",
  "Behaviour issues",
  "All equipment returned",
  "Learners helped each other",
  "Strong engagement",
  "Other",
];

const formSchema = z.object({
  date: z.string().min(1),
  duration: z.enum(["1_hour", "2_hours", "3_hours", "4_hours", "full_day"]),
  sessionType: z.string(),
  schoolOrOrganizationName: z.string().min(1, "Required"),
  totalLearners: z.coerce.number().min(0),
  learningTrack: z.string(),
  femaleCount: z.coerce.number().min(0),
  maleCount: z.coerce.number().min(0),
  exceptionalLearnersNotes: z.string().optional(),
  engagementLevel: z.union([z.number().min(1).max(5), z.nan()]).optional(),
  ranAsPlanned: z.boolean(),
  ranAsPlannedNotes: z.string().optional(),
  technicalChallenges: z.boolean(),
  technicalChallengesDescription: z.string().optional(),
  highlights: z.array(z.string()),
  objectivesMet: z.enum(["yes", "partially", "no"]),
  curriculumAdjustmentsSuggested: z.boolean(),
  curriculumAdjustmentsDescription: z.string().optional(),
  incidentOccurred: z.boolean(),
  incidentFollowUp: z.string().optional(),
  equipmentReturned: z.boolean(),
  honestyConfirmed: z.boolean(),
  leadEducatorId: z.string().min(1, "Select lead facilitator"),
  assistantEducatorIds: z
    .array(z.string())
    .refine(
      (arr) => arr.filter((id) => id !== NO_COACH_VALUE).length <= MAX_ASSISTANTS,
      { message: `Maximum ${MAX_ASSISTANTS} assistants allowed` }
    ),
});

type FormValues = z.infer<typeof formSchema>;

function reportToFormValues(r: SessionReport): FormValues {
  return {
    date: r.date,
    duration: r.duration,
    sessionType: r.sessionType,
    schoolOrOrganizationName: r.schoolOrOrganizationName,
    totalLearners: r.totalLearners,
    learningTrack: r.learningTrack,
    femaleCount: r.femaleCount,
    maleCount: r.maleCount,
    exceptionalLearnersNotes: r.exceptionalLearnersNotes ?? "",
    engagementLevel: r.engagementLevel ?? undefined,
    ranAsPlanned: r.ranAsPlanned,
    ranAsPlannedNotes: r.ranAsPlannedNotes ?? "",
    technicalChallenges: r.technicalChallenges,
    technicalChallengesDescription: r.technicalChallengesDescription ?? "",
    highlights: r.highlights ?? [],
    objectivesMet: r.objectivesMet,
    curriculumAdjustmentsSuggested: r.curriculumAdjustmentsSuggested,
    curriculumAdjustmentsDescription: r.curriculumAdjustmentsDescription ?? "",
    incidentOccurred: r.incidentOccurred,
    incidentFollowUp: r.incidentFollowUp ?? "",
    equipmentReturned: r.equipmentReturned,
    honestyConfirmed: r.honestyConfirmed,
    leadEducatorId: r.leadEducatorId ?? "",
    assistantEducatorIds: r.assistantEducatorIds ?? [],
  };
}

export default function SessionReportPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { getBySession: getAttendanceBySession } = useAttendance();
  const { getBySession: getReportBySession, saveReport, saveCoachFeedback } = useSessionReports();
  const { getFeedbackForSession } = useLearnerFeedback();
  const { getSessionById } = useSessions();

  const session = getSessionById(sessionId ?? "");
  const cls = session ? getClass(session.classId) : null;
  const existingReport = sessionId ? getReportBySession(sessionId) : undefined;
  const attendanceRecords = sessionId ? getAttendanceBySession(sessionId) : [];
  const presentCount = attendanceRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const educators = mockUsers.filter((u) => u.role === "educator");
  const [coachDialogOpen, setCoachDialogOpen] = useState(false);
  const [coachFeedbackText, setCoachFeedbackText] = useState("");
  const role = getSessionRoleForUser(session, currentUser);
  useEffect(() => {
    setCoachFeedbackText(existingReport?.coachFeedback?.find((e) => e.educatorId === currentUser?.id)?.text ?? "");
  }, [existingReport?.coachFeedback, currentUser?.id]);

  const defaultValues: FormValues = existingReport
    ? reportToFormValues(existingReport)
    : {
        date: session?.date ?? "",
        duration: session?.duration ?? "1_hour",
        sessionType: session?.sessionType ?? "makerspace",
        schoolOrOrganizationName: cls?.name ?? "",
        totalLearners: attendanceRecords.length > 0 ? presentCount : (cls?.learnerIds.length ?? 0),
        learningTrack: session?.learningTrack ?? "game_design",
        femaleCount: 0,
        maleCount: 0,
        exceptionalLearnersNotes: "",
        engagementLevel: undefined,
        ranAsPlanned: true,
        ranAsPlannedNotes: "",
        technicalChallenges: false,
        technicalChallengesDescription: "",
        highlights: [],
        objectivesMet: "yes",
        curriculumAdjustmentsSuggested: false,
        curriculumAdjustmentsDescription: "",
        incidentOccurred: false,
        incidentFollowUp: "",
        equipmentReturned: true,
        honestyConfirmed: false,
        leadEducatorId: existingReport?.leadEducatorId ?? session?.leadEducatorId ?? currentUser?.id ?? cls?.educatorId ?? "",
        assistantEducatorIds: existingReport?.assistantEducatorIds ?? session?.assistantEducatorIds ?? [],
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  if (!session || !cls) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Session not found.</p>
        <Link to="/educator/dashboard" className="text-primary hover:underline text-sm">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const isSubmitted = existingReport?.status === "submitted";

  const durationToHours: Record<string, number> = { "1_hour": 1, "2_hours": 2, "3_hours": 3, "4_hours": 4, full_day: 6 };

  function toReport(values: FormValues): SessionReport {
    const assistantIds = values.assistantEducatorIds.filter((id) => id !== NO_COACH_VALUE);
    return {
      id: existingReport?.id ?? "",
      sessionId: session.id,
      status: existingReport?.status ?? "draft",
      leadEducatorId: values.leadEducatorId,
      assistantEducatorIds: assistantIds,
      date: values.date,
      duration: values.duration,
      durationHours: existingReport?.durationHours ?? durationToHours[values.duration] ?? 1,
      sessionType: values.sessionType as SessionReport["sessionType"],
      schoolOrOrganizationName: values.schoolOrOrganizationName,
      totalLearners: values.totalLearners,
      learningTrack: values.learningTrack as SessionReport["learningTrack"],
      femaleCount: values.femaleCount,
      maleCount: values.maleCount,
      exceptionalLearnersNotes: values.exceptionalLearnersNotes || undefined,
      engagementLevel: (values.engagementLevel as EngagementLevel) ?? undefined,
      ranAsPlanned: values.ranAsPlanned,
      ranAsPlannedNotes: values.ranAsPlannedNotes || undefined,
      technicalChallenges: values.technicalChallenges,
      technicalChallengesDescription: values.technicalChallengesDescription || undefined,
      highlights: values.highlights,
      objectivesMet: values.objectivesMet as ObjectivesMet,
      curriculumAdjustmentsSuggested: values.curriculumAdjustmentsSuggested,
      curriculumAdjustmentsDescription: values.curriculumAdjustmentsDescription || undefined,
      incidentOccurred: values.incidentOccurred,
      incidentFollowUp: values.incidentFollowUp || undefined,
      equipmentReturned: values.equipmentReturned,
      honestyConfirmed: values.honestyConfirmed,
    };
  }

  function onSaveDraft(values: FormValues) {
    saveReport({ ...toReport(values), status: "draft" });
  }

  function onSubmitReport(values: FormValues) {
    saveReport({
      ...toReport(values),
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <Link
        to={`/educator/classes/${session.classId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to class
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Session Report
          </CardTitle>
          <CardDescription>
            {SESSION_TYPE_LABELS[session.sessionType]} – {cls.name} · {session.date} {session.startTime}–{session.endTime}
          </CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SessionRoleChips session={session} />
            {canEditSession(session, currentUser) && (
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCoachDialogOpen(true)}>
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Manage coaches
              </Button>
            )}
          </div>
          {session && (
            <AddCoachDialog session={session} open={coachDialogOpen} onOpenChange={setCoachDialogOpen} />
          )}
          {/* Coach feedback: coaches can add/edit; visibility: admin, facilitator, or author */}
          {role === "coach" && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Coach feedback
                </CardTitle>
                <CardDescription>Your feedback on this session (visible to the facilitator and admin).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="e.g. Observations, suggestions, what went well..."
                  value={coachFeedbackText}
                  onChange={(e) => setCoachFeedbackText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (sessionId && currentUser?.id) {
                      saveCoachFeedback(sessionId, currentUser.id, coachFeedbackText);
                    }
                  }}
                >
                  Save feedback
                </Button>
              </CardContent>
            </Card>
          )}
          {/* Show coach feedback entries (admin, facilitator, or the coach who wrote each) */}
          {existingReport?.coachFeedback && existingReport.coachFeedback.length > 0 && (currentUser?.role === "admin" || session?.leadEducatorId === currentUser?.id || existingReport.coachFeedback.some((e) => e.educatorId === currentUser?.id)) && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Coach feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingReport.coachFeedback
                  .filter((e) => currentUser?.role === "admin" || session?.leadEducatorId === currentUser?.id || e.educatorId === currentUser?.id)
                  .map((entry) => (
                    <div key={entry.educatorId} className="rounded-md border bg-muted/30 p-3 text-sm">
                      <p className="font-medium text-muted-foreground mb-1">
                        {educators.find((u) => u.id === entry.educatorId)?.name ?? "Coach"} · {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      <p className="whitespace-pre-wrap">{entry.text}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
          {/* Learner feedback: submitted by students for this session */}
          {sessionId && (() => {
            const learnerFeedbacks = getFeedbackForSession(sessionId);
            return learnerFeedbacks.length > 0 ? (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Learner feedback
                  </CardTitle>
                  <CardDescription>Feedback from learners who attended this session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {learnerFeedbacks.map((f) => {
                    const learner = getLearner(f.studentId);
                    const name = learner ? `${learner.firstName} ${learner.lastName}` : f.studentId;
                    return (
                      <div key={`${f.sessionId}-${f.studentId}`} className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                        <p className="font-medium">{name}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-4 h-4 ${n <= f.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                          ))}
                          <span className="text-muted-foreground text-xs ml-1">· Understood: {f.understood}</span>
                        </div>
                        {f.likedMost && <p><span className="text-muted-foreground">Liked most:</span> {f.likedMost}</p>}
                        {f.improvement && <p><span className="text-muted-foreground">Improve:</span> {f.improvement}</p>}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : null;
          })()}
          {attendanceRecords.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Pre-filled: {presentCount} learners marked present/late in attendance. Adjust if needed.
            </p>
          )}
        </CardHeader>
      </Card>

      {isSubmitted ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">This report has been submitted.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submitted {existingReport?.submittedAt
                ? new Date(existingReport.submittedAt).toLocaleString()
                : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form className="space-y-6">
            {/* Session info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session details</CardTitle>
                <CardDescription>Pre-filled from session and attendance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(["1_hour", "2_hours", "3_hours", "4_hours", "full_day"] as const).map((d) => (
                              <SelectItem key={d} value={d}>
                                {SESSION_DURATION_LABELS[d]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="schoolOrOrganizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School or organisation name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalLearners"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total learners (this session)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="learningTrack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning track</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(LEARNING_TRACK_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="femaleCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Female count</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maleCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Male count</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="exceptionalLearnersNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exceptional learners / notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Any notes about learners who need extra support or stood out" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Lead & assistant facilitators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facilitators</CardTitle>
                <CardDescription>Who led and who assisted during this session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="leadEducatorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead facilitator of the session *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-col gap-2"
                        >
                          {educators.map((edu) => (
                            <div key={edu.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={edu.id} id={`lead-${edu.id}`} />
                              <label
                                htmlFor={`lead-${edu.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {edu.name}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assistantEducatorIds"
                  render={({ field }) => {
                    const selected = field.value.filter((id) => id !== NO_COACH_VALUE);
                    const noCoachChecked = field.value.includes(NO_COACH_VALUE);
                    return (
                      <FormItem>
                        <FormLabel>Facilitators who assisted during the session</FormLabel>
                        <FormDescription className="sr-only">
                          Select up to 4 assistants, or &quot;No coach needed&quot; if none.
                        </FormDescription>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="no-coach"
                                checked={noCoachChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) field.onChange([NO_COACH_VALUE]);
                                  else field.onChange([]);
                                }}
                              />
                              <label
                                htmlFor="no-coach"
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                No coach needed
                              </label>
                            </div>
                            {!noCoachChecked &&
                              educators.map((edu) => {
                                const isChecked = selected.includes(edu.id);
                                const atMax = selected.length >= MAX_ASSISTANTS && !isChecked;
                                return (
                                  <div key={edu.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`assist-${edu.id}`}
                                      checked={isChecked}
                                      disabled={atMax}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          if (selected.length < MAX_ASSISTANTS)
                                            field.onChange([...selected, edu.id]);
                                        } else {
                                          field.onChange(selected.filter((id) => id !== edu.id));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`assist-${edu.id}`}
                                      className={`text-sm font-medium leading-none cursor-pointer ${atMax ? "text-muted-foreground" : ""}`}
                                    >
                                      {edu.name}
                                    </label>
                                  </div>
                                );
                              })}
                            {!noCoachChecked && selected.length >= MAX_ASSISTANTS && (
                              <p className="text-xs text-muted-foreground">
                                Maximum {MAX_ASSISTANTS} assistants selected.
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </CardContent>
            </Card>

            {/* Engagement & delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Engagement & delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="engagementLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engagement level (1–5)</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                        value={field.value != null ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} – {n <= 2 ? "Low" : n === 3 ? "Moderate" : "High"}
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
                  name="ranAsPlanned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Session ran as planned</FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("ranAsPlanned") === false && (
                  <FormField
                    control={form.control}
                    name="ranAsPlannedNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="What changed?" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="technicalChallenges"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Technical challenges</FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("technicalChallenges") && (
                  <FormField
                    control={form.control}
                    name="technicalChallengesDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="e.g. Internet dropped, projector failed" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="highlights"
                  render={() => (
                    <FormItem>
                      <FormLabel>Highlights</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {HIGHLIGHT_OPTIONS.map((opt) => (
                          <FormField
                            key={opt}
                            control={form.control}
                            name="highlights"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes(opt)}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...field.value, opt]
                                        : field.value.filter((x) => x !== opt);
                                      field.onChange(next);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">{opt}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objectivesMet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objectives met</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="partially">Partially</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Curriculum & incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Curriculum & incidents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="curriculumAdjustmentsSuggested"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Curriculum adjustments suggested</FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("curriculumAdjustmentsSuggested") && (
                  <FormField
                    control={form.control}
                    name="curriculumAdjustmentsDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="incidentOccurred"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Incident occurred</FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("incidentOccurred") && (
                  <FormField
                    control={form.control}
                    name="incidentFollowUp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="What happened and any follow-up" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Equipment & confirmation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equipment & confirmation</CardTitle>
                <CardDescription>Did you return all equipment? (Inventory link can be added here later.)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="equipmentReturned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">All equipment returned</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="honestyConfirmed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">I confirm the information in this report is accurate</FormLabel>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={form.handleSubmit(onSaveDraft)}>
                Save draft
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmitReport)}
                disabled={!form.watch("honestyConfirmed")}
              >
                <Send className="w-4 h-4 mr-1" /> Submit report
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
