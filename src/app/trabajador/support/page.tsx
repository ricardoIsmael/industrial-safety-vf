"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Headphones, UserCircle, MoreVertical, ChevronLeft, MessageSquare, Loader2 } from "lucide-react";
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

interface ConversationResponse {
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

interface ContactItem {
  id: string;
  name: string;
  role: string;
  type: "INSTRUCTOR" | "SUPPORT";
  courseId?: string;
  courseName?: string;
  conversationId: string | null;
  lastMsg: string;
  lastMessageAt: string | null;
  unread: number;
}

const SUPPORT_PARTY_ID = "IS-SUPPORT";

export default function TrabajadorSupportPage() {
  const { data: session } = useSession();
  const userId = session?.keycloakId as string | undefined;
  const userName = session?.user?.name ?? "Trabajador";

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadContacts(userId);
  }, [userId]);

  const loadContacts = async (uid: string) => {
    setLoadingContacts(true);
    try {
      const convRes = await fetch(`/api/proxy/chat/conversations/student/${uid}`);
      const conversations: ConversationResponse[] = convRes.ok ? await convRes.json() : [];

      const supportConv = conversations.find(c => c.type === "SUPPORT");
      const supportContact: ContactItem = {
        id: SUPPORT_PARTY_ID,
        name: "Soporte Técnico IS",
        role: "Equipo de Soporte",
        type: "SUPPORT",
        conversationId: supportConv?.id ?? null,
        lastMsg: supportConv?.lastMessagePreview ?? "¿En qué podemos ayudarte?",
        lastMessageAt: supportConv?.lastMessageAt ?? null,
        unread: supportConv?.unreadForStudent ?? 0,
      };

      setContacts([supportContact]);
    } catch (e) {
      console.error("Error cargando contactos:", e);
    } finally {
      setLoadingContacts(false);
    }
  };

  const openChat = async (contact: ContactItem) => {
    if (!userId) return;
    stopPolling();
    setActiveContactId(contact.id);
    setMobileView("chat");
    setMessages([]);
    setLoadingMessages(true);
    try {
      let convId = contact.conversationId;
      if (!convId) {
        const body = {
          type: contact.type,
          studentId: userId,
          studentName: userName,
          studentAvatarUrl: "",
          otherPartyId: contact.id,
          otherPartyName: contact.name,
          otherPartyRole: contact.role,
          otherPartyAvatarUrl: "",
          courseId: null,
          courseName: null,
        };
        const res = await fetch("/api/proxy/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        const conv: ConversationResponse = await res.json();
        convId = conv.id;
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, conversationId: convId } : c));
      }
      await fetchMessages(convId, userId);
      startPolling(convId, userId);
    } catch (e) {
      console.error("Error abriendo chat:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchMessages = async (convId: string, readerId: string) => {
    const res = await fetch(`/api/proxy/chat/conversations/${convId}/messages`);
    if (!res.ok) return;
    const msgs: ChatMessage[] = await res.json();
    setMessages(msgs);
    fetch(`/api/proxy/chat/conversations/${convId}/read?readerId=${readerId}`, { method: "PATCH" });
    setContacts(prev => prev.map(c => c.conversationId === convId ? { ...c, unread: 0 } : c));
  };

  const startPolling = (convId: string, readerId: string) => {
    pollRef.current = setInterval(() => fetchMessages(convId, readerId), 3000);
  };
  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPolling(), []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeContact = contacts.find(c => c.id === activeContactId);
    if (!inputText.trim() || !userId || !activeContact?.conversationId) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");
    try {
      const res = await fetch(`/api/proxy/chat/conversations/${activeContact.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: userId,
          senderName: userName,
          senderRole: "TRABAJADOR",
          senderAvatarUrl: "",
          content: text,
        }),
      });
      if (!res.ok) { setInputText(text); return; }
      const newMsg: ChatMessage = await res.json();
      setMessages(prev => [...prev, newMsg]);
      setContacts(prev => prev.map(c => c.id === activeContactId
        ? { ...c, lastMsg: text, lastMessageAt: newMsg.createdAt } : c));
    } catch (e) {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const activeContact = contacts.find(c => c.id === activeContactId) ?? null;
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return d.toLocaleDateString("es-ES", { weekday: "short" });
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="h-[calc(100vh-10rem)] bg-background flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 rounded-xl overflow-hidden">

      <Card className={cn(
        "w-full md:w-80 lg:w-96 flex-col shrink-0 border-border bg-surface/50 overflow-hidden h-full",
        mobileView === "chat" ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Soporte</h2>
          <ReportarIncidenteButton role="TRABAJADOR" className="w-full" />
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <Input placeholder="Buscar..." className="pl-9 bg-surface-secondary/50 border-border"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingContacts ? (
            <div className="flex items-center justify-center h-24 text-muted">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando...
            </div>
          ) : (
            filteredContacts.map(contact => (
              <button key={contact.id} onClick={() => openChat(contact)}
                className={cn(
                  "w-full text-left p-3 flex gap-3 rounded-lg transition-colors border",
                  activeContactId === contact.id ? "bg-primary/10 border-primary/30" : "bg-transparent border-transparent hover:bg-surface-secondary"
                )}>
                <div className="relative shrink-0">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-black">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-surface rounded-full" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden text-sm">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold truncate text-primary">{contact.name}</span>
                    <span className="text-[10px] text-muted whitespace-nowrap">{formatTime(contact.lastMessageAt)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xs text-muted truncate">{contact.lastMsg}</p>
                    {contact.unread > 0 && (
                      <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px]">
                        {contact.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className={cn(
        "flex-1 flex-col border-border bg-surface/50 overflow-hidden h-[calc(100vh-10rem)] md:h-full",
        mobileView === "list" ? "hidden md:flex" : "flex"
      )}>
        {activeContact ? (
          <>
            <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface-secondary/20">
              <div className="flex items-center gap-2 md:gap-3">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8 text-muted hover:text-foreground"
                  onClick={() => { setMobileView("list"); stopPolling(); }}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-black">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary">{activeContact.name}</h3>
                  <p className="text-xs text-muted">{activeContact.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col relative w-full">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando mensajes...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted gap-2">
                  <MessageSquare className="h-10 w-10 text-border" />
                  <p className="text-sm">Inicia la conversación</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div key={idx} className={cn("flex max-w-[80%] flex-col", isMe ? "self-end items-end" : "self-start items-start")}>
                      <div className={cn("p-3 rounded-2xl text-sm shadow-sm",
                        isMe ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-surface-secondary border border-border rounded-tl-none")}>
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

            <div className="p-4 border-t border-border bg-surface-secondary/10">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input placeholder="Escribe un mensaje..." className="flex-1 bg-surface border-border"
                  value={inputText} onChange={e => setInputText(e.target.value)} />
                <Button type="submit" size="icon" className="shrink-0" disabled={!inputText.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <MessageSquare className="h-12 w-12 text-border mb-4" />
            <p>Selecciona un chat para empezar</p>
          </div>
        )}
      </Card>
    </div>
  );
}
