import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Feedback } from "@/types";

interface LearnerFeedbackContextType {
  /** All submitted learner feedback (in memory; replace with API later). */
  feedbacks: Feedback[];
  /** Submit or overwrite feedback for a session from a learner. */
  addFeedback: (feedback: Feedback) => void;
  /** Get all feedback entries for a session (for educators to view). */
  getFeedbackForSession: (sessionId: string) => Feedback[];
}

const LearnerFeedbackContext = createContext<LearnerFeedbackContextType | undefined>(undefined);

export function LearnerFeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const addFeedback = useCallback((feedback: Feedback) => {
    setFeedbacks((prev) => {
      const rest = prev.filter(
        (f) => !(f.sessionId === feedback.sessionId && f.studentId === feedback.studentId)
      );
      return [...rest, feedback];
    });
  }, []);

  const getFeedbackForSession = useCallback(
    (sessionId: string) => feedbacks.filter((f) => f.sessionId === sessionId),
    [feedbacks]
  );

  const value = useMemo(
    () => ({ feedbacks, addFeedback, getFeedbackForSession }),
    [feedbacks, addFeedback, getFeedbackForSession]
  );

  return (
    <LearnerFeedbackContext.Provider value={value}>
      {children}
    </LearnerFeedbackContext.Provider>
  );
}

export function useLearnerFeedback() {
  const ctx = useContext(LearnerFeedbackContext);
  if (!ctx) throw new Error("useLearnerFeedback must be used within LearnerFeedbackProvider");
  return ctx;
}
