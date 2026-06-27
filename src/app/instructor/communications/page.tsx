"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Send, Headphones, UserCircle, MoreVertical,
  ChevronLeft, Inbox, ShieldAlert, MessageSquare, Loader2, MessagesSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ReportarIncidenteButton } from "@/components/incidencias/reportar-incidente-button";

/* ─── Types ─────────────────────────────────────────── */
interface ForumPost {
  id: string; courseId: string; authorId: string; authorName: string;
  authorRole: string | null; authorAvatarUrl: string | null;
  content: string; createdAt: string; replies: Reply[];
}
interface Reply {
  authorId: string; authorName: string; authorRole: string | null;
  authorAvatarUrl: string | null; content: string; createdAt: string;
}
interface CourseThread {
  courseId: string; courseTitle: string; posts: ForumPost[];
  lastActivity: string; unread: number;
}
interface ChatConversation {
  id: string; type: string; studentId: string; studentName: string;
  studentAvatarUrl: string | null; courseId?: string; courseName?: string;
  lastMessageAt?: string; lastMessagePreview?: string; unreadForOtherParty: number;
}
interface ChatMessage {
  id: string; conversationId: string; senderId: string; senderName: string;
  senderRole: string; content: string; createdAt: string; read: boolean;
}

const ADMIN_CONTACTS = [
  {
    id: "adm-ticket-812", name: "Ticket #812 - Problema Servidor",
    role: "Soporte Técnico Sistema", lastMsg: "Hemos purgado la caché. Intenta subir el video de nuevo.",
    time: "Lun", unread: 0,
    messages: [
      { id: 1, sender: "me", text: "Hola equipo de IT. Tengo un error al subir un video de 500MB en el módulo de EPP.", time: "09:00 AM" },
      { id: 2, sender: "them", text: "Hola Roberto. Hemos diagnosticado el problema, era un colapso en la caché del S3 Bucket.", time: "05:00 PM" },
      { id: 3, sender: "them", text: "Hemos purgado la caché. Intenta subir el video de nuevo.", time: "05:15 PM" },
    ],
  },
];

/* ─── Component ──────────────────────────────────────── */
export default function CommunicationsPage() {
  const { data: session } = useSession();
  const instructorId = session?.keycloakId as string | undefined;

  // main tabs
  const [activeTab, setActiveTab] = useState<"students" | "admin">("students");
  // students sub-tabs
  const [studentSub, setStudentSub] = useState<"forum" | "messages">("forum");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [search, setSearch] = useState("");

  // forum
  const [threads, setThreads] = useState<CourseThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<CourseThread | null>(null);
  const [forumLoading, setForumLoading] = useState(false);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  // direct messages
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // admin (mock)
  const [adminInput, setAdminInput] = useState("");
  const [adminChats, setAdminChats] = useState(ADMIN_CONTACTS);
  const [activeAdminId, setActiveAdminId] = useState(ADMIN_CONTACTS[0].id);

  /* ── Load forum ── */
  useEffect(() => {
    if (activeTab === "students" && studentSub === "forum") loadForum();
  }, [activeTab, studentSub, session?.dbId]);

  const loadForum = async () => {
    if (!session?.dbId) return;
    setForumLoading(true);
    try {
      const coursesRes = await fetch("/api/proxy/course/my-courses");
      if (!coursesRes.ok) return;
      const courses: any[] = await coursesRes.json();
      const built: CourseThread[] = [];
      for (const course of courses) {
        const postsRes = await fetch(`/api/proxy/chat/forum/${course.id}`);
        if (!postsRes.ok) continue;
        const posts: ForumPost[] = await postsRes.json();
        if (posts.length === 0) continue;
        const unread = posts.filter(p => !p.replies.some(r => r.authorId === (session.dbId as string))).length;
        built.push({ courseId: course.id, courseTitle: course.title, posts, lastActivity: posts[0].createdAt, unread });
      }
      setThreads(built);
      setSelectedThread(prev => {
        if (!prev) return built[0] ?? null;
        return built.find(t => t.courseId === prev.courseId) ?? prev;
      });
    } catch (e) { console.error(e); }
    finally { setForumLoading(false); }
  };

  const handleReply = async (postId: string) => {
    const text = replies[postId]?.trim();
    if (!text || !session) return;
    setSendingReplyId(postId);
    try {
      const res = await fetch(`/api/proxy/chat/forum/${selectedThread?.courseId}/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: session.dbId ?? session.user?.email ?? "instructor",
          authorName: session.user?.name ?? "Instructor",
          authorRole: "INSTRUCTOR",
          authorAvatarUrl: session.user?.image ?? null,
          content: text,
        }),
      });
      if (res.ok) {
        setReplies(prev => ({ ...prev, [postId]: "" }));
        loadForum();
      }
    } catch (e) { console.error(e); }
    finally { setSendingReplyId(null); }
  };

  /* ── Load conversations ── */
  useEffect(() => {
    if (activeTab === "students" && studentSub === "messages" && instructorId) loadConversations();
  }, [activeTab, studentSub, instructorId]);

  const loadConversations = async () => {
    if (!instructorId) return;
    setConvsLoading(true);
    try {
      const res = await fetch(`/api/proxy/chat/conversations/instructor/${instructorId}`);
      if (!res.ok) return;
      const data: ChatConversation[] = await res.json();
      setConversations(data);
      if (data.length > 0 && !activeConvId) openConversation(data[0]);
    } catch (e) { console.error(e); }
    finally { setConvsLoading(false); }
  };

  const openConversation = async (conv: ChatConversation) => {
    if (!instructorId) return;
    stopPolling();
    setActiveConvId(conv.id);
    setMobileView("chat");
    setMessages([]);
    setMsgLoading(true);
    try {
      await fetchMessages(conv.id, instructorId);
      startPolling(conv.id, instructorId);
    } finally { setMsgLoading(false); }
  };

  const fetchMessages = async (convId: string, readerId: string) => {
    const res = await fetch(`/api/proxy/chat/conversations/${convId}/messages`);
    if (!res.ok) return;
    const msgs: ChatMessage[] = await res.json();
    setMessages(msgs);
    fetch(`/api/proxy/chat/conversations/${convId}/read?readerId=${readerId}`, { method: "PATCH" });
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadForOtherParty: 0 } : c));
  };

  const startPolling = (convId: string, readerId: string) => {
    pollRef.current = setInterval(() => fetchMessages(convId, readerId), 3000);
  };
  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };
  useEffect(() => () => stopPolling(), []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !instructorId || !activeConvId) return;
    setSendingMsg(true);
    const text = msgInput.trim();
    setMsgInput("");
    try {
      const res = await fetch(`/api/proxy/chat/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: instructorId,
          senderName: session?.user?.name ?? "Instructor",
          senderRole: "INSTRUCTOR",
          senderAvatarUrl: session?.user?.image ?? "",
          content: text,
        }),
      });
      if (!res.ok) { setMsgInput(text); return; }
      const newMsg: ChatMessage = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setConversations(prev => prev.map(c => c.id === activeConvId
        ? { ...c, lastMessagePreview: text, lastMessageAt: newMsg.createdAt } : c));
    } catch (e) { console.error(e); setMsgInput(text); }
    finally { setSendingMsg(false); }
  };

  /* ── Admin mock ── */
  const handleAdminSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInput.trim()) return;
    setAdminChats(prev => prev.map(c => c.id !== activeAdminId ? c : {
      ...c,
      messages: [...c.messages, { id: Date.now(), sender: "me", text: adminInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }],
      lastMsg: adminInput.trim(), time: "Ahora",
    }));
    setAdminInput("");
  };

  /* ── Helpers ── */
  const formatDate = (iso: string) => {
    const d = new Date(iso), diff = Date.now() - d.getTime();
    if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const activeAdmin = adminChats.find(c => c.id === activeAdminId);
  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const filteredThreads = threads.filter(t => t.courseTitle.toLowerCase().includes(search.toLowerCase()));
  const filteredConvs = conversations.filter(c => c.studentName.toLowerCase().includes(search.toLowerCase()));

  /* ─────────────────────────────── JSX ─────────────────────────────── */
  return (
    <div className="h-[calc(100vh-10rem)] bg-background flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 rounded-xl overflow-hidden pb-16 md:pb-0">

      {/* ── Sidebar ── */}
      <Card className={cn(
        "w-full md:w-80 lg:w-96 flex-col shrink-0 border-border bg-surface/50 overflow-hidden h-[calc(100vh-14rem)] md:h-full",
        mobileView === "chat" ? "hidden md:flex" : "flex"
      )}>
        {/* Reportar incidencia a TI */}
        <div className="p-3 border-b border-border shrink-0">
          <ReportarIncidenteButton role="INSTRUCTOR" className="w-full" />
        </div>

        {/* Main tabs */}
        <div className="flex border-b border-border bg-surface-secondary/30 shrink-0">
          <button onClick={() => { setActiveTab("students"); setMobileView("list"); }}
            className={cn("flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2",
              activeTab === "students" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted border-b-2 border-transparent hover:text-foreground")}>
            <Inbox className="h-4 w-4" /> Alumnos
          </button>
          <button onClick={() => { setActiveTab("admin"); setMobileView("list"); }}
            className={cn("flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2",
              activeTab === "admin" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted border-b-2 border-transparent hover:text-foreground")}>
            <ShieldAlert className="h-4 w-4" /> IT Support
          </button>
        </div>

        {/* Students sub-tabs */}
        {activeTab === "students" && (
          <div className="flex border-b border-border/60 bg-surface-secondary/10 shrink-0">
            <button onClick={() => setStudentSub("forum")}
              className={cn("flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                studentSub === "forum" ? "text-primary border-b-2 border-primary" : "text-muted border-b-2 border-transparent hover:text-foreground")}>
              <MessagesSquare className="h-3.5 w-3.5" /> Foro
            </button>
            <button onClick={() => setStudentSub("messages")}
              className={cn("flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                studentSub === "messages" ? "text-primary border-b-2 border-primary" : "text-muted border-b-2 border-transparent hover:text-foreground")}>
              <MessageSquare className="h-3.5 w-3.5" /> Mensajes
              {conversations.some(c => c.unreadForOtherParty > 0) && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
            </button>
          </div>
        )}

        <div className="p-4 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <Input placeholder="Buscar..." className="pl-9 bg-surface-secondary/50 border-border"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Forum list */}
          {activeTab === "students" && studentSub === "forum" && (
            forumLoading
              ? <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted" /></div>
              : filteredThreads.length === 0
                ? <p className="p-4 text-sm text-muted text-center">Sin preguntas en el foro</p>
                : filteredThreads.map(thread => (
                  <button key={thread.courseId}
                    onClick={() => { setSelectedThread(thread); setMobileView("chat"); }}
                    className={cn("w-full text-left p-3 flex gap-3 rounded-lg transition-colors border",
                      selectedThread?.courseId === thread.courseId ? "bg-primary/10 border-primary/30" : "bg-transparent border-transparent hover:bg-surface-secondary")}>
                    <div className="h-10 w-10 rounded-full bg-surface-secondary flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {thread.courseTitle.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold truncate">{thread.courseTitle}</span>
                        <span className="text-[10px] text-muted whitespace-nowrap">{formatDate(thread.lastActivity)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-xs text-muted truncate">{thread.posts[0]?.content.slice(0, 50)}...</p>
                        {thread.unread > 0 && (
                          <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px]">{thread.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
          )}

          {/* Direct messages list */}
          {activeTab === "students" && studentSub === "messages" && (
            convsLoading
              ? <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted" /></div>
              : filteredConvs.length === 0
                ? <p className="p-4 text-sm text-muted text-center">Sin mensajes directos aún</p>
                : filteredConvs.map(conv => (
                  <button key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={cn("w-full text-left p-3 flex gap-3 rounded-lg transition-colors border",
                      activeConvId === conv.id ? "bg-primary/10 border-primary/30" : "bg-transparent border-transparent hover:bg-surface-secondary")}>
                    <div className="h-10 w-10 rounded-full bg-surface-secondary flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {conv.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold truncate">{conv.studentName}</span>
                        <span className="text-[10px] text-muted whitespace-nowrap">
                          {conv.lastMessageAt ? formatDate(conv.lastMessageAt) : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-xs text-muted truncate">{conv.lastMessagePreview ?? conv.courseName ?? "—"}</p>
                        {conv.unreadForOtherParty > 0 && (
                          <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px]">{conv.unreadForOtherParty}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
          )}

          {/* Admin list */}
          {activeTab === "admin" && adminChats.map(c => (
            <button key={c.id} onClick={() => { setActiveAdminId(c.id); setMobileView("chat"); }}
              className={cn("w-full text-left p-3 flex gap-3 rounded-lg transition-colors border",
                activeAdminId === c.id ? "bg-primary/10 border-primary/30" : "bg-transparent border-transparent hover:bg-surface-secondary")}>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-black shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-primary truncate">{c.name}</span>
                  <span className="text-[10px] text-muted">{c.time}</span>
                </div>
                <p className="text-xs text-muted truncate">{c.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* ── Right panel ── */}
      <Card className={cn(
        "flex-1 flex-col border-border bg-surface/50 overflow-hidden h-[calc(100vh-14rem)] md:h-full",
        mobileView === "list" ? "hidden md:flex" : "flex"
      )}>

        {/* Forum view */}
        {activeTab === "students" && studentSub === "forum" && selectedThread && (
          <>
            <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface-secondary/20">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted" onClick={() => setMobileView("list")}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h3 className="font-bold text-sm">Foro: {selectedThread.courseTitle}</h3>
                  <p className="text-xs text-muted">{selectedThread.posts.length} pregunta(s)</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {selectedThread.posts.map(post => (
                <div key={post.id} className="space-y-3">
                  <div className="flex gap-4">
                    <Avatar src={post.authorAvatarUrl ?? undefined} fallback={<UserCircle className="h-5 w-5" />} className="shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{post.authorName}</span>
                        <span className="text-xs text-muted">{formatDate(post.createdAt)}</span>
                      </div>
                      <p className="text-sm bg-surface-secondary/40 p-3 rounded-lg rounded-tl-none border border-border/50">{post.content}</p>
                    </div>
                  </div>
                  {post.replies.map((r, ri) => (
                    <div key={ri} className="flex gap-4 ml-12">
                      <Avatar src={r.authorAvatarUrl ?? undefined} fallback={r.authorName[0]}
                        className={cn("shrink-0", r.authorRole === "INSTRUCTOR" && "ring-2 ring-primary/50")} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("font-semibold text-sm", r.authorRole === "INSTRUCTOR" && "text-primary")}>{r.authorName}</span>
                          {r.authorRole === "INSTRUCTOR" && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 text-primary">Instructor</Badge>
                          )}
                          <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                        </div>
                        <p className={cn("text-sm p-3 rounded-lg rounded-tl-none border",
                          r.authorRole === "INSTRUCTOR" ? "bg-primary/5 border-primary/20" : "bg-surface-secondary/40 border-border/50")}>
                          {r.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="ml-12 flex gap-3 items-center">
                    <Avatar src={session?.user?.image ?? undefined} fallback={(session?.user?.name ?? "I")[0]}
                      className="shrink-0 ring-2 ring-primary/50" />
                    <div className="relative flex-1">
                      <Input placeholder="Responder como instructor..." value={replies[post.id] ?? ""}
                        onChange={e => setReplies(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(post.id); } }}
                        className="pr-12 bg-surface border-border" />
                      <Button size="icon" variant="ghost" type="button"
                        disabled={!replies[post.id]?.trim() || sendingReplyId === post.id} onClick={() => handleReply(post.id)}
                        className="absolute right-1 top-1 h-8 w-8 text-primary hover:bg-primary/10">
                        {sendingReplyId === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Direct messages view */}
        {activeTab === "students" && studentSub === "messages" && activeConv && (
          <>
            <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface-secondary/20">
              <div className="flex items-center gap-2 md:gap-3">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted" onClick={() => { setMobileView("list"); stopPolling(); }}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 rounded-full bg-surface-secondary flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {activeConv.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{activeConv.studentName}</h3>
                  {activeConv.courseName && <p className="text-xs text-muted">{activeConv.courseName}</p>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <MessageSquare className="h-10 w-10 text-border" />
                  <p className="text-sm">Sin mensajes aún</p>
                </div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.senderId === instructorId;
                return (
                  <div key={idx} className={cn("flex max-w-[80%] flex-col", isMe ? "self-end items-end" : "self-start items-start")}>
                    <div className={cn("p-3 rounded-2xl text-sm shadow-sm",
                      isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-surface-secondary border border-border rounded-tl-none")}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted mt-1 px-1">
                      {formatDate(msg.createdAt)} {isMe && "✓✓"}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-surface-secondary/10 shrink-0">
              <form onSubmit={handleSendMsg} className="flex gap-2">
                <Input placeholder="Escribe un mensaje..." className="flex-1 bg-surface border-border"
                  value={msgInput} onChange={e => setMsgInput(e.target.value)} />
                <Button type="submit" size="icon" disabled={!msgInput.trim() || sendingMsg}>
                  {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        )}

        {/* Admin view */}
        {activeTab === "admin" && activeAdmin && (
          <>
            <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface-secondary/20">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted" onClick={() => setMobileView("list")}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-black">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary">{activeAdmin.name}</h3>
                  <p className="text-xs text-muted">{activeAdmin.role}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {activeAdmin.messages.map((msg, i) => {
                const isMe = msg.sender === "me";
                return (
                  <div key={i} className={cn("flex max-w-[80%] flex-col", isMe ? "self-end items-end" : "self-start items-start")}>
                    <div className={cn("p-3 rounded-2xl text-sm shadow-sm",
                      isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-surface-secondary border border-border rounded-tl-none")}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted mt-1 px-1">{msg.time} {isMe && "✓✓"}</span>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-border bg-surface-secondary/10 shrink-0">
              <form onSubmit={handleAdminSend} className="flex gap-2">
                <Input placeholder="Escribir mensaje a IT..." className="flex-1 bg-surface border-border"
                  value={adminInput} onChange={e => setAdminInput(e.target.value)} />
                <Button type="submit" size="icon" disabled={!adminInput.trim()}><Send className="h-4 w-4" /></Button>
              </form>
            </div>
          </>
        )}

        {/* Empty state */}
        {(
          (activeTab === "students" && studentSub === "forum" && !selectedThread) ||
          (activeTab === "students" && studentSub === "messages" && !activeConv && !convsLoading) ||
          (activeTab === "admin" && !activeAdmin)
        ) && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <MessageSquare className="h-12 w-12 text-border mb-4" />
            <p>Selecciona una conversación</p>
          </div>
        )}
      </Card>
    </div>
  );
}
