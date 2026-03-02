import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Task, TaskStatus } from "@/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  createdById: string;
  assigneeIds: string[];
  status?: TaskStatus;
  dueDate?: string;
  trackId?: string | null;
  classId?: string | null;
}

export interface TasksContextValue {
  tasks: Task[];
  createTask: (input: CreateTaskInput) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  getTaskById: (id: string) => Task | undefined;
  getTasksForAssignee: (userId: string) => Task[];
  getTasksCreatedBy: (userId: string) => Task[];
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

const now = () => new Date().toISOString();

const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Review Scratch Loops lesson plan",
    description: "Check Week 3 Loops Challenge template and suggest one differentiation option.",
    createdById: "u16",
    assigneeIds: ["u2"],
    status: "in_progress",
    dueDate: "2026-03-15",
    trackId: "game_design",
    createdAt: "2026-02-20",
    updatedAt: "2026-02-22",
  },
  {
    id: "task-2",
    title: "Submit session report for 28 Feb",
    description: "Ensure report is submitted within 48 hours of the session.",
    createdById: "u16",
    assigneeIds: ["u2"],
    status: "todo",
    dueDate: "2026-03-02",
    createdAt: "2026-02-25",
  },
];

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const nextIdRef = useRef(3); // INITIAL_TASKS use task-1, task-2

  const createTask = useCallback((input: CreateTaskInput): Task => {
    const created = now();
    const id = `task-${nextIdRef.current++}`;
    const task: Task = {
      id,
      title: input.title,
      description: input.description,
      createdById: input.createdById,
      assigneeIds: [...(input.assigneeIds || [])],
      status: (input.status ?? "todo") as TaskStatus,
      dueDate: input.dueDate,
      trackId: (input.trackId as Task["trackId"]) ?? null,
      classId: input.classId ?? null,
      createdAt: created,
    };
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: now() } : t
      )
    );
  }, []);

  const getTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks]
  );

  const getTasksForAssignee = useCallback(
    (userId: string) =>
      tasks.filter((t) => t.assigneeIds.includes(userId)).sort((a, b) => {
        const aDue = a.dueDate ?? "9999-12-31";
        const bDue = b.dueDate ?? "9999-12-31";
        return aDue.localeCompare(bDue) || a.createdAt.localeCompare(b.createdAt);
      }),
    [tasks]
  );

  const getTasksCreatedBy = useCallback(
    (userId: string) =>
      tasks.filter((t) => t.createdById === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tasks]
  );

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      createTask,
      updateTask,
      getTaskById,
      getTasksForAssignee,
      getTasksCreatedBy,
    }),
    [tasks, createTask, updateTask, getTaskById, getTasksForAssignee, getTasksCreatedBy]
  );

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}

export function useMyTasks(userId: string): Task[] {
  const { getTasksForAssignee } = useTasks();
  return useMemo(() => getTasksForAssignee(userId), [userId, getTasksForAssignee]);
}

export function useTasksCreatedBy(userId: string): Task[] {
  const { getTasksCreatedBy } = useTasks();
  return useMemo(() => getTasksCreatedBy(userId), [userId, getTasksCreatedBy]);
}
