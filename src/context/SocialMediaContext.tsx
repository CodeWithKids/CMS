import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SocialPost } from "@/types";

interface SocialMediaContextType {
  posts: SocialPost[];
  addPost: (p: Omit<SocialPost, "id" | "createdAt">) => void;
}

const SocialMediaContext = createContext<SocialMediaContextType | undefined>(undefined);

const INITIAL_POSTS: SocialPost[] = [
  { id: "sm1", platform: "Facebook", title: "STEM Fair 2026 announcement", status: "published", publishedDate: "2026-02-01", createdAt: "2026-01-28" },
  { id: "sm2", platform: "Instagram", title: "Learner showcase – Scratch projects", status: "scheduled", scheduledDate: "2026-03-10", createdAt: "2026-02-05" },
  { id: "sm3", platform: "Facebook", title: "Term 2 sign-up reminder", status: "draft", createdAt: "2026-02-10" },
];

function nextId(posts: SocialPost[]): string {
  const max = posts.reduce((m, p) => {
    const n = parseInt(p.id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `sm${max + 1}`;
}

export function SocialMediaProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<SocialPost[]>(INITIAL_POSTS);

  const addPost = useCallback((p: Omit<SocialPost, "id" | "createdAt">) => {
    setPosts((prev) => {
      const id = nextId(prev);
      const createdAt = new Date().toISOString().slice(0, 10);
      return [...prev, { ...p, id, createdAt }];
    });
  }, []);

  const value = useMemo(() => ({ posts, addPost }), [posts, addPost]);

  return (
    <SocialMediaContext.Provider value={value}>
      {children}
    </SocialMediaContext.Provider>
  );
}

export function useSocialMedia() {
  const ctx = useContext(SocialMediaContext);
  if (!ctx) throw new Error("useSocialMedia must be used within SocialMediaProvider");
  return ctx;
}
