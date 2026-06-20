"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, ShieldCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface AppUser {
  id: string;
  name?: string;
  lastName?: string;
  email?: string;
}

interface RoleRequest {
  id: string;
  codigo?: string;
  userId: string;
  currentRole?: string;
  targetRole?: string;
  reason?: string;
  status: string;
  requestedBy?: string;
  approvedBy?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export default function AdminAccesosPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/proxy/users/role-requests").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/proxy/users").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([reqs, us]) => {
        setRequests(Array.isArray(reqs) ? reqs : []);
        const map: Record<string, AppUser> = {};
        (Array.isArray(us) ? us : []).forEach((u: AppUser) => {
          map[u.id] = u;
        });
        setUsers(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/proxy/users/role-requests/${id}/${action}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(session?.dbId ?? ""),
        },
        body: action === "reject" ? JSON.stringify({ motivo: "Rechazada por el administrador" }) : undefined,
      });
      if (!res.ok) throw new Error();
      toast.success(action === "approve" ? "Ascenso aprobado — rol actualizado en Keycloak" : "Solicitud rechazada");
      load();
    } catch {
      toast.error("No se pudo procesar la solicitud");
    } finally {
      setBusy(null);
    }
  };

  const name = (id: string) => {
    const u = users[id];
    return u ? `${u.name ?? ""} ${u.lastName ?? ""}`.trim() || u.email || id : id;
  };
  const email = (id: string) => users[id]?.email ?? "";

  const isPending = (s: string) => {
    const u = (s || "").toUpperCase();
    return u === "PENDIENTE" || u === "PENDING";
  };

  const badge = (s: string) => {
    const u = (s || "").toUpperCase();
    if (isPending(s)) return <Badge className="bg-warning text-black"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    if (u === "APROBADA" || u === "APPROVED") return <Badge className="bg-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
    return <Badge className="bg-danger text-white"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
  };

  const pending = requests.filter((r) => isPending(r.status));
  const resolved = requests.filter((r) => !isPending(r.status));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" /> Solicitudes de Acceso
        </h1>
        <p className="text-muted">
          Solicitudes de ascenso enviadas por Gerencia. Al aprobar, el rol del empleado cambia automáticamente.
        </p>
      </div>

      {/* Pendientes */}
      <section>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" /> Pendientes de aprobación
        </h2>
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : pending.length === 0 ? (
          <Card className="bg-surface/40 border-border">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
              <p className="font-semibold">No hay solicitudes pendientes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((r) => (
              <Card key={r.id} className="bg-surface/60 border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{r.codigo}</span>
                    {badge(r.status)}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name(r.userId)}</p>
                      <p className="text-xs text-muted">{email(r.userId)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted">{r.currentRole} → <span className="text-blue-400 font-medium">{r.targetRole}</span></p>
                  {r.reason && <p className="text-xs text-muted line-clamp-2">{r.reason}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> {busy === r.id ? "..." : "Aprobar"}
                    </Button>
                    <Button
                      className="flex-1 bg-danger hover:bg-danger/90 text-white"
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "reject")}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> {busy === r.id ? "..." : "Rechazar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Resueltas */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-muted">
            <CheckCircle className="h-4 w-4" /> Resueltas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resolved.map((r) => (
              <Card key={r.id} className="bg-surface/30 border-border opacity-80">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{name(r.userId)}</p>
                    {badge(r.status)}
                  </div>
                  <p className="text-xs text-muted">{r.currentRole} → {r.targetRole}</p>
                  {r.approvedBy && <p className="text-xs text-muted">Por: {r.approvedBy}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
