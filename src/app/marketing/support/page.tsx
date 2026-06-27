"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send, Headphones, MoreVertical, User,
  ChevronLeft, MessageSquare, Loader2, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ReportarIncidenteButton } from "@/components/incidencias/reportar-incidente-button";

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  id: string;
  type: "INSTRUCTOR" | "SUPPORT";
  studentId: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyRole: string;
  courseId?: string;
  courseName?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadForStudent: number;
}

const SUPPORT_PARTY_ID = "IS-SUPPORT";

export default function MarketingSupportPage() {
  const { data: session } = useSession();
  const userId = (session as any)?.keycloakId as string | undefined;
  const userName = session?.user?.name ?? "Usuario";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await fetch(`/api/proxy/chat/conversations/student/${userId}`);
      if (res.ok) setConversations(await res.json());
    } finally {
      setLoadingConvs(false);
    }
  };

  const openConversation = async (conv: Conversation | null, forceSupport = false) => {
    stopPolling();
    setInputText("");
    setMobileView("chat");
    setLoadingMessages(true);
    try {
      let convId = conv?.id ?? null;

      if (!convId && forceSupport) {
        const res = await fetch("/api/proxy/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SUPPORT",
            studentId: userId,
            studentName: userName,
            studentAvatarUrl: "",
            otherPartyId: SUPPORT_PARTY_ID,
            otherPartyName: "Soporte Técnico IS",
            otherPartyRole: "Equipo de Soporte",
            otherPartyAvatarUrl: "",
            courseId: null,
            courseName: null,
          }),
        });
        if (!res.ok) return;
        const newConv: Conversation = await res.json();
        convId = newConv.id;
        setConversations(prev => [newConv, ...prev]);
      }

      if (!convId) return;
      setActiveConvId(convId);
      await fetchMessages(convId);
      startPolling(convId);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    const res = await fetch(`/api/proxy/chat/conversations/${convId}/messages`);
    if (!res.ok) return;
    const msgs: ChatMessage[] = await res.json();
    setMessages(msgs);
    if (userId) {
      fetch(`/api/proxy/chat/conversations/${convId}/read?readerId=${userId}`, { method: "PATCH" }).catch(() => {});
    }
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unreadForStudent: 0 } : c)
    );
  };

  const startPolling = (convId: string) => {
    pollRef.current = setInterval(() => fetchMessages(convId), 3000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !userId || !activeConvId) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");
    try {
      const res = await fetch(`/api/proxy/chat/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          senderName: userName,
          senderRole: "MARKETING",
          senderAvatarUrl: "",
          content: text,
        }),
      });
      if (!res.ok) { setInputText(text); return; }
      const newMsg: ChatMessage = await res.json();
      setMessages(prev => [...prev, newMsg]);
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return d.toLocaleDateString("es-ES", { weekday: "short" });
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const supportConv = conversations.find(c => c.type === "SUPPORT");
  const instructorConvs = conversations.filter(c => c.type === "INSTRUCTOR");
  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const chatOpen = mobileView === "chat";

  return (
    <div className="h-[calc(100vh-10rem)] bg-background flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 rounded-xl overflow-hidden">

      {/* Sidebar */}
      <Card className={cn(
        "w-full md:w-80 lg:w-96 flex-col shrink-0 border-border bg-surface/50 overflow-hidden h-full",
        chatOpen ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold tracking-tight">Comunicaciones</h2>
          <p className="text-xs text-muted mt-1">Soporte e instructores de cursos.</p>
          <div className="mt-3">
            <ReportarIncidenteButton role="MARKETING" className="w-full" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-24 text-muted">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando...
            </div>
          ) : (
            <>
              {/* IS-SUPPORT */}
              <div className="px-2 pt-2 pb-1">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Soporte</p>
              </div>
              <button
                onClick={() => openConversation(supportConv ?? null, true)}
                className={cn(
                  "w-full text-left p-3 flex gap-3 rounded-lg transition-colors border",
                  activeConvId === (supportConv?.id ?? null) && chatOpen
                    ? "bg-primary/10 border-primary/30"
                    : "bg-transparent border-transparent hover:bg-surface-secondary"
                )}
              >
                <div className="relative shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-black">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-surface rounded-full" />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-primary truncate">Soporte Técnico IS</p>
                    {supportConv?.lastMessageAt && (
                      <span className="text-[10px] text-muted shrink-0">{formatTime(supportConv.lastMessageAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">
                    {supportConv?.lastMessagePreview ?? "¿En qué podemos ayudarte?"}
                  </p>
                </div>
                {(supportConv?.unreadForStudent ?? 0) > 0 && (
                  <Badge className="h-5 px-1.5 text-[9px] shrink-0 self-center">{supportConv!.unreadForStudent}</Badge>
                )}
              </button>

              {/* Instructor conversations */}
              {instructorConvs.length > 0 && (
                <>
                  <div className="px-2 pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Instructores</p>
                  </div>
                  {instructorConvs.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className={cn(
                        "w-full text-left p-3 flex gap-3 rounded-lg transition-colors border",
                        activeConvId === conv.id && chatOpen
                          ? "bg-pink-500/10 border-pink-500/30"
                          : "bg-transparent border-transparent hover:bg-surface-secondary"
                      )}
                    >
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-secondary border border-border">
                          <User className="h-5 w-5 text-muted" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-sm">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold truncate">{conv.otherPartyName || "Instructor"}</p>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-muted shrink-0">{formatTime(conv.lastMessageAt)}</span>
                          )}
                        </div>
                        {conv.courseName && (
                          <p className="text-[10px] text-pink-400 truncate flex items-center gap-1">
                            <BookOpen className="h-2.5 w-2.5" /> {conv.courseName}
                          </p>
                        )}
                        <p className="text-xs text-muted truncate mt-0.5">
                          {conv.lastMessagePreview ?? "Notificación de cupón"}
                        </p>
                      </div>
                      {conv.unreadForStudent > 0 && (
                        <Badge className="h-5 px-1.5 text-[9px] shrink-0 self-center">{conv.unreadForStudent}</Badge>
                      )}
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className={cn(
        "flex-1 flex-col border-border bg-surface/50 overflow-hidden h-[calc(100vh-10rem)] md:h-full",
        !chatOpen ? "hidden md:flex" : "flex"
      )}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface-secondary/20">
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="ghost" size="icon"
                  className="md:hidden shrink-0 h-8 w-8 text-muted hover:text-foreground"
                  onClick={() => { setMobileView("list"); stopPolling(); }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-full shrink-0",
                  activeConv.type === "SUPPORT" ? "bg-primary text-black" : "bg-surface-secondary border border-border"
                )}>
                  {activeConv.type === "SUPPORT"
                    ? <Headphones className="h-5 w-5" />
                    : <User className="h-5 w-5 text-muted" />
                  }
                </div>
                <div>
                  <h3 className={cn(
                    "font-bold text-sm",
                    activeConv.type === "SUPPORT" ? "text-primary" : "text-foreground"
                  )}>
                    {activeConv.type === "SUPPORT" ? "Soporte Técnico IS" : (activeConv.otherPartyName || "Instructor")}
                  </h3>
                  <p className="text-xs text-muted">
                    {activeConv.type === "SUPPORT" ? "Equipo de Soporte" : activeConv.courseName ?? activeConv.otherPartyRole}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando mensajes...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <MessageSquare className="h-10 w-10 text-border" />
                  <p className="text-sm">No hay mensajes aún</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div key={idx} className={cn("flex max-w-[80%] flex-col", isMe ? "self-end items-end" : "self-start items-start")}>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm",
                        isMe
                          ? "bg-pink-500 text-white rounded-tr-none"
                          : "bg-surface-secondary border border-border rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted mt-1 px-1">
                        {formatTime(msg.createdAt)} {isMe && "✓✓"}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-surface-secondary/10">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-surface border-border"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <Button type="submit" size="icon" className="shrink-0" disabled={!inputText.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted gap-3">
            <MessageSquare className="h-12 w-12 text-border" />
            <p className="text-sm">Selecciona una conversación</p>
          </div>
        )}
      </Card>
    </div>
  );
}
