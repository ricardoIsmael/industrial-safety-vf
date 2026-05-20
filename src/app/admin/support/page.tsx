"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send, Headphones, MoreVertical, Search,
  ChevronLeft, MessageSquare, Loader2, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface UserItem {
  id: string;
  keycloakId: string;
  name: string;
  lastName: string;
  email: string;
  role: string;
  conversationId: string | null;
  lastMsg: string;
  lastMessageAt: string | null;
  unread: number;
}

const SUPPORT_ID = "IS-SUPPORT";
const SUPPORT_NAME = "Soporte Técnico IS";

const getRoleLabel = (role: string) => {
  const r = role?.toUpperCase() || '';
  if (r.includes('ADMINISTRADOR')) return 'Admin';
  if (r.includes('GERENCIA')) return 'Gerencia';
  if (r.includes('JEFE_SEGURIDAD')) return 'Jefatura';
  if (r.includes('LOGISTICA')) return 'Logística';
  if (r.includes('MARKETING')) return 'Marketing';
  if (r.includes('TRABAJADOR')) return 'Planta';
  if (r.includes('INSTRUCTOR')) return 'Instructor';
  if (r.includes('ALUMNO')) return 'Alumno';
  return 'Usuario';
};

export default function AdminSupportPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<UserItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, convsRes] = await Promise.all([
        fetch("/api/proxy/users"),
        fetch("/api/proxy/chat/conversations/support"),
      ]);

      if (!usersRes.ok) return;
      const data: any[] = await usersRes.json();

      // Mapa keycloakId → conversación existente
      const convMap: Record<string, any> = {};
      if (convsRes.ok) {
        const convs: any[] = await convsRes.json();
        convs.forEach(c => { convMap[c.studentId] = c; });
      }

      const filtered = data
        .filter(u => u.keycloakId && !u.role?.toUpperCase().includes('ADMINISTRADOR'))
        .map(u => {
          const conv = convMap[u.keycloakId];
          return {
            id: u.id,
            keycloakId: u.keycloakId,
            name: u.name || "",
            lastName: u.lastName || "",
            email: u.email || "",
            role: u.role || "",
            conversationId: conv?.id ?? null,
            lastMsg: conv?.lastMessagePreview || "Sin mensajes aún",
            lastMessageAt: conv?.lastMessageAt ?? null,
            unread: conv?.unreadForOtherParty ?? 0,
          };
        });

      // Ordenar: primero los que tienen mensajes recientes
      filtered.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      setUsers(filtered);
    } catch (e) {
      console.error("Error cargando usuarios:", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openChat = async (user: UserItem) => {
    stopPolling();
    setActiveUser(user);
    setMobileView("chat");
    setMessages([]);
    setLoadingMessages(true);
    try {
      let convId = user.conversationId;
      if (!convId) {
        const res = await fetch("/api/proxy/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "SUPPORT",
            studentId: user.keycloakId,
            studentName: `${user.name} ${user.lastName}`.trim(),
            studentAvatarUrl: "",
            otherPartyId: SUPPORT_ID,
            otherPartyName: SUPPORT_NAME,
            otherPartyRole: "Equipo de Soporte",
            otherPartyAvatarUrl: "",
            courseId: null,
            courseName: null,
          }),
        });
        if (!res.ok) return;
        const conv = await res.json();
        convId = conv.id;
        setUsers(prev => prev.map(u => u.keycloakId === user.keycloakId ? { ...u, conversationId: convId } : u));
        setActiveUser(prev => prev ? { ...prev, conversationId: convId } : prev);
      }
      await fetchMessages(convId!);
      startPolling(convId!);
    } catch (e) {
      console.error("Error abriendo chat:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    const res = await fetch(`/api/proxy/chat/conversations/${convId}/messages`);
    if (!res.ok) return;
    const msgs: ChatMessage[] = await res.json();
    setMessages(msgs);
    const last = msgs[msgs.length - 1];
    if (last) {
      setUsers(prev => prev.map(u => u.conversationId === convId
        ? { ...u, lastMsg: last.content, lastMessageAt: last.createdAt, unread: 0 }
        : u
      ));
    }
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
    if (!inputText.trim() || !activeUser?.conversationId) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");
    try {
      const res = await fetch(`/api/proxy/chat/conversations/${activeUser.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: SUPPORT_ID,
          senderName: SUPPORT_NAME,
          senderRole: "SUPPORT",
          senderAvatarUrl: "",
          content: text,
        }),
      });
      if (!res.ok) { setInputText(text); return; }
      const newMsg: ChatMessage = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setUsers(prev => prev.map(u => u.keycloakId === activeUser?.keycloakId
        ? { ...u, lastMsg: text, lastMessageAt: newMsg.createdAt }
        : u
      ));
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return d.toLocaleDateString("es-ES", { weekday: "short" });
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const filteredUsers = users.filter(u =>
    `${u.name} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    getRoleLabel(u.role).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-10rem)] bg-background flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 rounded-xl overflow-hidden">

      {/* Sidebar — lista de usuarios */}
      <Card className={cn(
        "w-full md:w-80 lg:w-96 flex-col shrink-0 border-border bg-surface/50 overflow-hidden h-full",
        mobileView === "chat" ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Bandeja de Soporte</h2>
          </div>
          <p className="text-xs text-muted">Selecciona un usuario para responder su solicitud.</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <Input
              placeholder="Buscar usuario..."
              className="pl-9 bg-surface-secondary/50 border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingUsers ? (
            <div className="flex items-center justify-center h-24 text-muted">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando usuarios...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">No se encontraron usuarios</div>
          ) : (
            filteredUsers.map(user => (
              <button
                key={user.keycloakId}
                onClick={() => openChat(user)}
                className={cn(
                  "w-full text-left p-3 flex gap-3 rounded-lg transition-colors border",
                  activeUser?.keycloakId === user.keycloakId
                    ? "bg-primary/10 border-primary/30"
                    : "bg-transparent border-transparent hover:bg-surface-secondary"
                )}
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-secondary shrink-0">
                  <UserCircle className="h-6 w-6 text-muted" />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold truncate">{user.name} {user.lastName}</span>
                    <span className="text-[10px] text-muted whitespace-nowrap shrink-0">{formatTime(user.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-xs truncate", user.unread > 0 ? "text-foreground font-medium" : "text-muted")}>{user.lastMsg}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {user.unread > 0 && (
                        <span className="h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                          {user.unread > 9 ? "9+" : user.unread}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{getRoleLabel(user.role)}</Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className={cn(
        "flex-1 flex-col border-border bg-surface/50 overflow-hidden h-[calc(100vh-10rem)] md:h-full",
        mobileView === "list" ? "hidden md:flex" : "flex"
      )}>
        {activeUser ? (
          <>
            <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface-secondary/20">
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="ghost" size="icon"
                  className="md:hidden shrink-0 h-8 w-8 text-muted hover:text-foreground"
                  onClick={() => { setMobileView("list"); stopPolling(); }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-secondary shrink-0">
                  <UserCircle className="h-6 w-6 text-muted" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{activeUser.name} {activeUser.lastName}</h3>
                  <p className="text-xs text-muted">{activeUser.email} · {getRoleLabel(activeUser.role)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando mensajes...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <MessageSquare className="h-10 w-10 text-border" />
                  <p className="text-sm">Sin mensajes aún — inicia la conversación</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSupport = msg.senderId === SUPPORT_ID;
                  return (
                    <div key={idx} className={cn("flex max-w-[80%] flex-col", isSupport ? "self-end items-end" : "self-start items-start")}>
                      {!isSupport && (
                        <span className="text-[10px] text-muted mb-1 px-1">{msg.senderName}</span>
                      )}
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm",
                        isSupport
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-surface-secondary border border-border rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted mt-1 px-1">
                        {formatTime(msg.createdAt)} {isSupport && "✓✓"}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-surface-secondary/10">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  placeholder={activeUser.conversationId ? "Responde como Soporte..." : "Abriendo conversación..."}
                  className="flex-1 bg-surface border-border"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={!activeUser.conversationId}
                />
                <Button type="submit" size="icon" className="shrink-0" disabled={!inputText.trim() || sending || !activeUser.conversationId}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <Headphones className="h-12 w-12 text-border mb-4" />
            <p className="font-medium">Bandeja de Soporte</p>
            <p className="text-sm mt-1">Selecciona un usuario para ver o iniciar la conversación</p>
          </div>
        )}
      </Card>
    </div>
  );
}
