"use client";

import { Badge } from "@/components/ui/badge";
import { Bell, User, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn, getRoleDisplayName } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { CartDropdown } from "@/components/layout/cart-dropdown";
import { useNotifications } from "@/components/providers/notifications-provider";

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Ahora";
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const roleColors: Record<string, { primary: string; bg: string; border: string }> = {
  "Jefe de Seguridad":  { primary: "text-amber-500",  bg: "bg-amber-500/20",  border: "border-amber-500/30"  },
  "Gerente General":    { primary: "text-emerald-500", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  "Operario / Empleado":{ primary: "text-blue-500",   bg: "bg-blue-500/20",   border: "border-blue-500/30"   },
  "Estudiante":         { primary: "text-purple-500",  bg: "bg-purple-500/20",  border: "border-purple-500/30" },
};

export default function Navbar() {
  const { data: session } = useSession();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { notifications, clearAll } = useNotifications();

  const currentRole = getRoleDisplayName((session as any)?.roles ?? []);
  const colors = roleColors[currentRole] ?? roleColors["Jefe de Seguridad"];

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [notificationsOpen]);

  const headerTitles: Record<string, string> = {
    "Jefe de Seguridad":   "Seguridad Industrial / Panel de Control",
    "Gerente General":     "Gerencia / Resumen Ejecutivo",
    "Operario / Empleado": "Seguridad Industrial / Portal de Formación",
    "Estudiante":          "Seguridad Industrial / Portal de Formación",
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-surface/50 backdrop-blur-md px-6 z-50">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted truncate max-w-[200px] md:max-w-none">
          <span className="hidden sm:inline">{headerTitles[currentRole] ?? "Seguridad Industrial / Panel"}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4 relative">
        {(currentRole === "Estudiante" || currentRole === "Alumno") && (
          <div className="mr-2">
            <CartDropdown />
          </div>
        )}

        {/* Campana */}
        <button
          aria-label={`Notificaciones${notifications.length > 0 ? `, ${notifications.length} nuevas` : ""}`}
          aria-expanded={notificationsOpen}
          aria-haspopup="dialog"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className={cn(
            "relative p-2 rounded-full transition-colors",
            notificationsOpen
              ? `${colors.bg} ${colors.primary}`
              : "text-muted hover:bg-surface-secondary hover:text-foreground"
          )}
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
            </span>
          )}
        </button>

        {/* Panel de notificaciones */}
        {notificationsOpen && (
          <div className="absolute top-12 right-10 w-80 bg-surface border border-slate-800 shadow-xl rounded-xl z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-semibold text-sm">Notificaciones</h3>
              <button onClick={() => setNotificationsOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted">
                  Sin notificaciones nuevas
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = n.success ? CheckCircle2 : AlertTriangle;
                  return (
                    <div key={n.id} className="p-3 rounded-lg border border-transparent hover:border-slate-700 hover:bg-surface-secondary mb-1 transition-colors">
                      <div className="flex gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          n.success ? "bg-primary/10" : "bg-danger/10"
                        )}>
                          <Icon className={cn("h-4 w-4", n.success ? "text-primary" : "text-danger")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{n.title}</p>
                          {n.message && (
                            <p className="text-xs text-muted mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                          )}
                          <span className="text-[10px] text-muted-foreground mt-1.5 block">
                            {formatRelativeTime(n.receivedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-800 bg-surface-secondary/30 rounded-b-xl text-center">
                <button
                  onClick={() => { clearAll(); setNotificationsOpen(false); }}
                  className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Limpiar todo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Perfil */}
        {session?.user && (
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
              <User className="h-4 w-4 text-muted" />
            </div>
            <div className="hidden flex-col items-start sm:flex">
              <span className="text-sm font-medium text-foreground">{session.user.name ?? ""}</span>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colors.border, colors.primary, colors.bg)}>
                {currentRole}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
