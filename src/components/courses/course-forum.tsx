"use client";
import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import type { ForumPost } from "@/types/course";

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Ahora";
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function CourseForum({ cursoId }: { cursoId: string }) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadForum = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/chat/forum/${cursoId}`);
      if (res.ok) setPosts(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadForum(); }, [cursoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;
    setSubmitting(true);
    try {
      const body = {
        authorId: (session as any).dbId ?? session.user?.email ?? "unknown",
        authorName: session.user?.name ?? "Estudiante",
        authorRole: "ALUMNO",
        authorAvatarUrl: session.user?.image ?? null,
        content: newComment.trim(),
      };
      const url = replyTo
        ? `/api/proxy/chat/forum/${cursoId}/${replyTo}/reply`
        : `/api/proxy/chat/forum/${cursoId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { setNewComment(""); setReplyTo(null); loadForum(); }
    } catch {}
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl animate-in fade-in duration-300">
      <div className="space-y-6 mb-6">
        {posts.length === 0 && (
          <p className="text-muted text-sm py-4">Sé el primero en hacer una pregunta.</p>
        )}
        {posts.map(post => (
          <div key={post.id}>
            <div className="flex gap-4">
              <Avatar src={post.authorAvatarUrl ?? undefined} fallback={post.authorName[0]} className="shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{post.authorName}</span>
                  {post.authorRole === "INSTRUCTOR" && (
                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 text-primary">Instructor</Badge>
                  )}
                  <span className="text-xs text-muted">{formatDate(post.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/90 bg-surface-secondary/40 p-3 rounded-lg rounded-tl-none border border-border/50">
                  {post.content}
                </p>
                <button
                  onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                  className="text-xs text-muted hover:text-primary mt-1 transition-colors"
                >
                  {replyTo === post.id ? "Cancelar" : "Responder"}
                </button>
              </div>
            </div>

            {post.replies.map((r, ri) => (
              <div key={ri} className="flex gap-4 ml-12 mt-3">
                <Avatar
                  src={r.authorAvatarUrl ?? undefined}
                  fallback={r.authorName[0]}
                  className={`shrink-0 ${r.authorRole === "INSTRUCTOR" ? "ring-2 ring-primary/50" : ""}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm ${r.authorRole === "INSTRUCTOR" ? "text-primary" : ""}`}>
                      {r.authorName}
                    </span>
                    {r.authorRole === "INSTRUCTOR" && (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 text-primary">Instructor</Badge>
                    )}
                    <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className={`text-sm text-foreground/90 p-3 rounded-lg rounded-tl-none border ${
                    r.authorRole === "INSTRUCTOR" ? "bg-primary/5 border-primary/20" : "bg-surface-secondary/40 border-border/50"
                  }`}>
                    {r.content}
                  </p>
                </div>
              </div>
            ))}

            {replyTo === post.id && (
              <form onSubmit={handleSubmit} className="mt-3 ml-12 flex gap-3 items-center">
                <Avatar src={session?.user?.image ?? undefined} fallback={(session?.user?.name ?? "U")[0]} />
                <div className="relative flex-1">
                  <Input
                    placeholder="Escribe una respuesta..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="pr-12 bg-surface-secondary border-border"
                  />
                  <Button size="icon" type="submit" variant="ghost"
                    disabled={!newComment.trim() || submitting}
                    className="absolute right-1 top-1 h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>

      {!replyTo && (
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <Avatar src={session?.user?.image ?? undefined} fallback={(session?.user?.name ?? "U")[0]} />
          <div className="relative flex-1">
            <Input
              placeholder="Haz una pregunta o deja un comentario..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="pr-12 bg-surface-secondary border-border"
            />
            <Button size="icon" type="submit" variant="ghost"
              disabled={!newComment.trim() || submitting}
              className="absolute right-1 top-1 h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
