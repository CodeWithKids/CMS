import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  link?: string | null;
  createdAt: string; // ISO
  read: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  addNotification: (userId: string, message: string, link?: string | null) => AppNotification;
  getForUser: (userId: string) => AppNotification[];
  getUnreadForUser: (userId: string) => AppNotification[];
  getUnreadCount: (userId: string) => number;
  markAsRead: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

function nextId(ref: React.MutableRefObject<number>): string {
  return `notif-${ref.current++}`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const nextIdRef = useRef(1);

  const addNotification = useCallback(
    (userId: string, message: string, link?: string | null): AppNotification => {
      const id = nextId(nextIdRef);
      const notif: AppNotification = {
        id,
        userId,
        message,
        link: link ?? null,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [...prev, notif]);
      return notif;
    },
    []
  );

  const getForUser = useCallback(
    (userId: string) =>
      notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications]
  );

  const getUnreadForUser = useCallback(
    (userId: string) => getForUser(userId).filter((n) => !n.read),
    [getForUser, notifications]
  );

  const getUnreadCount = useCallback(
    (userId: string) => getUnreadForUser(userId).length,
    [getUnreadForUser]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      getForUser,
      getUnreadForUser,
      getUnreadCount,
      markAsRead,
    }),
    [
      notifications,
      addNotification,
      getForUser,
      getUnreadForUser,
      getUnreadCount,
      markAsRead,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
