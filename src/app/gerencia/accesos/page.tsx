"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, ShieldCheck, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface AppUser {
  id: string;
  name?: string;
  lastName?: string;
  email?: string;
  role?: string;
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

const TARGET_ROLE = "JEFE_SEGURIDAD";

export default function GerenciaAccesosPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEmployees = () => {
    fetch("/api/proxy/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AppUser[]) =>
        setEmployees(
          (Array.isArray(data) ? data : []).filter((u) =>
            (u.role || "").toUpperCase().includes("TRABAJADOR")
          )
        )
      )
      .catch(() => setEmployees([]));
  };

  const loadRequests = () => {
    fetch("/api/proxy/users/role-requests")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: RoleRequest[]) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
    loadRequests();
  }, []);

  const empName = (u: AppUser) =>
    `${u.name ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id;
  const userById = (id: string) => employees.find((e) => e.id === id);

  const submit = async () => {
    if (!userId) {
      toast.error("Selecciona un empleado");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/proxy/users/role-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(session?.dbId ?? ""),
        },
        body: JSON.stringify({
          userId,
          targetRole: TARGET_ROLE,
          replaceRole: true,
          reason,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Solicitud de ascenso enviada — pendiente de aprobación del administrador");
      setUserId("");
      setReason("");
      loadRequests();
    } catch {
      toast.error("No se pudo enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const badge = (s: string) => {
    const u = (s || "").toUpperCase();
    if (u === "PENDIENTE" || u === "PENDING")
      return <Badge className="bg-warning text-black"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    if (u === "APROBADA" || u === "APPROVED")
      return <Badge className="bg-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
    return <Badge className="bg-danger text-white"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <UserCog className="h-8 w-8 text-emerald-500" /> Solicitudes de Acceso (Ascensos)
        </h1>
        <p className="text-muted">
          Solicita el ascenso de un empleado de planta a Jefe de Seguridad. El administrador revisa y aplica el cambio de rol.
        </p>
      </div>

      {/* Formulario */}
      <Card className="bg-surface/60 border-border">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" /> Nueva solicitud de ascenso
          </h2>

          <div>
            <label className="text-sm text-muted mb-1 block">Empleado (rol Trabajador)</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="">— Selecciona un empleado —</option>
              {employees.map((u) => (
                <option key={u.id} value={u.id}>
                  {empName(u)} ({u.email})
                </option>
              ))}
            </select>
            {employees.length === 0 && (
              <p className="text-xs text-muted mt-1">No hay empleados con rol Trabajador disponibles.</p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Ascenso a</label>
            <div className="rounded-md border border-border bg-surface-secondary/30 px-3 py-2 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" /> Jefe de Seguridad
            </div>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Justificación</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo del ascenso..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={submitting}
            onClick={submit}
          >
            <Send className="h-4 w-4 mr-2" /> {submitting ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de solicitudes */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Solicitudes enviadas</h2>
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : requests.length === 0 ? (
          <Card className="bg-surface/40 border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted">Aún no hay solicitudes de acceso.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((r) => (
              <Card key={r.id} className="bg-surface/60 border-border">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{r.codigo}</span>
                    {badge(r.status)}
                  </div>
                  <p className="font-semibold text-sm">
                    {userById(r.userId) ? empName(userById(r.userId)!) : r.userId}
                  </p>
                  <p className="text-xs text-muted">{r.currentRole} → {r.targetRole}</p>
                  {r.reason && <p className="text-xs text-muted line-clamp-2">{r.reason}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
