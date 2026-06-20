"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { toast } from "sonner";

export interface LiveNotification {
  id: string;
  title: string;
  message: string;
  success: boolean;
  receivedAt: Date;
}

interface NotificationsContextValue {
  notifications: LiveNotification[];
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  clearAll: () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const userId =
      (session?.keycloakId as string | undefined) ??
      (session?.dbId !== undefined ? String(session.dbId) : undefined);

    if (!userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL;
    if (!wsUrl) {
      console.warn("[ws] NEXT_PUBLIC_NOTIFICATION_WS_URL not set");
      return;
    }

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 4000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        subscriptionRef.current = client.subscribe(
          `/topic/notifications/${userId}`,
          (message: IMessage) => {
            try {
              const payload = JSON.parse(message.body) as {
                title?: string;
                message?: string;
                success?: boolean;
              };
              const notification: LiveNotification = {
                id: crypto.randomUUID(),
                title: payload.title ?? "Notificación",
                message: payload.message ?? "",
                success: payload.success !== false,
                receivedAt: new Date(),
              };
              setNotifications(prev => [notification, ...prev].slice(0, 20));
              if (!notification.success) {
                toast.error(notification.title, { description: notification.message });
              } else {
                toast.success(notification.title, { description: notification.message });
              }
              window.dispatchEvent(
                new CustomEvent("purchase-notification", { detail: payload })
              );
            } catch (err) {
              console.error("[ws] Failed to parse alert", err);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.warn("[ws] STOMP error", frame.headers["message"], frame.body);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try { subscriptionRef.current?.unsubscribe(); } catch {}
      subscriptionRef.current = null;
      client.deactivate().catch(() => {});
      clientRef.current = null;
    };
  }, [status, session?.keycloakId, session?.dbId]);

  return (
    <NotificationsContext.Provider value={{ notifications, clearAll: () => setNotifications([]) }}>
      {children}
    </NotificationsContext.Provider>
  );
}
