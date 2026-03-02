import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLearnerFeedback } from "@/context/LearnerFeedbackContext";
import { useSessions } from "@/context/SessionsContext";
import { getClass, getLearner } from "@/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Star, FileText } from "lucide-react";

export default function EducatorLearnerFeedbackPage() {
  const { currentUser } = useAuth();
  const educatorId = currentUser?.id ?? "";
  const { getFeedbackForSession, feedbacks } = useLearnerFeedback();
  const { getSessionsForEducatorByRole } = useSessions();

  const sessionsWithFeedback = useMemo(() => {
    const sessions = getSessionsForEducatorByRole(educatorId, { from: "2000-01-01", to: "2099-12-31" });
    return sessions
      .map((session) => ({
        session,
        feedbacks: getFeedbackForSession(session.id),
      }))
      .filter(({ feedbacks: fb }) => fb.length > 0)
      .sort((a, b) => (b.session.date > a.session.date ? 1 : -1))
      .slice(0, 50);
  }, [educatorId, getSessionsForEducatorByRole, getFeedbackForSession, feedbacks]);

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2">
        <MessageSquare className="w-6 h-6" /> Learner feedback
      </h1>
      <p className="page-subtitle text-muted-foreground mb-6">
        Feedback from learners on sessions you facilitated or coached. Open a session report to see full details.
      </p>

      {sessionsWithFeedback.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No learner feedback yet.</p>
            <p className="text-sm mt-1">When learners submit feedback on your sessions, it will appear here and on each session report.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessionsWithFeedback.map(({ session, feedbacks: fb }) => {
            const cls = getClass(session.classId);
            return (
              <Card key={session.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {cls?.name ?? session.classId} · {session.date}
                      </CardTitle>
                      <CardDescription>
                        {session.topic} · {session.startTime}–{session.endTime} · {fb.length} feedback{fb.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <Link
                      to={`/educator/sessions/${session.id}/report`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" /> View report
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fb.map((f) => {
                    const learner = getLearner(f.studentId);
                    const name = learner ? `${learner.firstName} ${learner.lastName}` : f.studentId;
                    return (
                      <div key={`${session.id}-${f.studentId}`} className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                        <p className="font-medium">{name}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-4 h-4 ${n <= f.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                          ))}
                          <span className="text-muted-foreground text-xs ml-1">· Understood: {f.understood}</span>
                        </div>
                        {f.likedMost && <p className="text-muted-foreground"><span className="text-foreground">Liked most:</span> {f.likedMost}</p>}
                        {f.improvement && <p className="text-muted-foreground"><span className="text-foreground">Improve:</span> {f.improvement}</p>}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
