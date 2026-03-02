import { useState } from "react";
import { getSessionsForStudent, getClass } from "@/mockData";
import { useLearnerFeedback } from "@/context/LearnerFeedbackContext";
import type { Feedback } from "@/types";
import { MessageSquare, Star, X } from "lucide-react";

export default function FeedbackPage() {
  const learnerId = "l1";
  const sessions = getSessionsForStudent(learnerId);
  const { addFeedback, getFeedbackForSession } = useLearnerFeedback();
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [understood, setUnderstood] = useState<Feedback["understood"]>("yes");
  const [likedMost, setLikedMost] = useState("");
  const [improvement, setImprovement] = useState("");

  const submitFeedback = (sessionId: string) => {
    addFeedback({ sessionId, studentId: learnerId, rating, understood, likedMost, improvement });
    setActiveSession(null);
    setRating(5);
    setUnderstood("yes");
    setLikedMost("");
    setImprovement("");
  };

  const feedbackForSession = (sessionId: string) => getFeedbackForSession(sessionId).find((f) => f.studentId === learnerId);

  return (
    <div className="page-container">
      <h1 className="page-title">Session Feedback</h1>
      <p className="page-subtitle">Share your thoughts on recent sessions</p>

      <div className="space-y-3">
        {sessions.map((s) => {
          const cls = getClass(s.classId);
          const hasFeedback = !!feedbackForSession(s.id);
          return (
            <div key={s.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{cls?.name} – {s.topic}</p>
                <p className="text-xs text-muted-foreground">{s.date} · {s.startTime} – {s.endTime}</p>
              </div>
              {hasFeedback ? (
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">Submitted ✓</span>
              ) : (
                <button
                  onClick={() => setActiveSession(s.id)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Give Feedback
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback Modal */}
      {activeSession && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Feedback
              </h2>
              <button onClick={() => setActiveSession(null)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} className="p-1">
                      <Star className={`w-6 h-6 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Did you understand today's lesson?</label>
                <div className="flex gap-2">
                  {(["yes", "somewhat", "no"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setUnderstood(opt)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium capitalize transition-colors ${
                        understood === opt ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">What did you like most?</label>
                <textarea
                  value={likedMost}
                  onChange={(e) => setLikedMost(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">What can we improve?</label>
                <textarea
                  value={improvement}
                  onChange={(e) => setImprovement(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                onClick={() => submitFeedback(activeSession)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
