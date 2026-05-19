"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, Package, Clock, CheckCircle, XCircle, Loader2, DollarSign,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface PurchaseRequest {
  id: number;
  categoria: string;
  descripcion?: string;
  cantidad: number;
  costoEstimado: number;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  fecha?: string;
  solicitanteNombre?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  EPP: "EPP",
  HERRAMIENTAS: "Herramientas",
  CAPACITACION: "Capacitación",
  EQUIPOS: "Equipos",
  MANTENIMIENTO: "Mantenimiento",
  OTROS: "Otros",
};

export default function BudgetPage() {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/purchase/requests")
      .then(r => r.ok ? r.json() : [])
      .then(data => setPurchases(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approved  = purchases.filter(p => p.estado === "APROBADO");
  const pending   = purchases.filter(p => p.estado === "PENDIENTE");
  const rejected  = purchases.filter(p => p.estado === "RECHAZADO");

  const totalApproved = approved.reduce((s, p) => s + (p.costoEstimado ?? 0), 0);
  const totalPending  = pending.reduce((s, p) => s + (p.costoEstimado ?? 0), 0);
  const totalAll      = purchases.reduce((s, p) => s + (p.costoEstimado ?? 0), 0);

  // Group approved cost by category for chart
  const byCategory = approved.reduce<Record<string, number>>((acc, p) => {
    const key = p.categoria ?? "OTROS";
    acc[key] = (acc[key] ?? 0) + (p.costoEstimado ?? 0);
    return acc;
  }, {});
  const catData = Object.entries(byCategory)
    .map(([cat, total]) => ({ name: CATEGORY_LABELS[cat] ?? cat, value: total }))
    .sort((a, b) => b.value - a.value);

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(n);

  const estadoBadge = (estado: string) => {
    if (estado === "APROBADO")  return <Badge className="bg-success/10 text-success border-success/30 text-[10px]">Aprobado</Badge>;
    if (estado === "PENDIENTE") return <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px]">Pendiente</Badge>;
    if (estado === "RECHAZADO") return <Badge className="bg-danger/10 text-danger border-danger/30 text-[10px]">Rechazado</Badge>;
    return <Badge variant="outline" className="text-[10px]">{estado}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">

      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-emerald-500" /> Inversión HSEQ
        </h1>
        <p className="text-muted">Solicitudes de compra de equipos y materiales de seguridad.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Solicitudes Totales",
            value: loading ? null : purchases.length,
            icon: Package,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            sub: loading ? "" : `${fmtCurrency(totalAll)} estimado total`,
          },
          {
            label: "Monto Aprobado",
            value: loading ? null : fmtCurrency(totalApproved),
            icon: CheckCircle,
            color: "text-success",
            bg: "bg-success/10",
            border: "border-success/20",
            sub: loading ? "" : `${approved.length} solicitudes aprobadas`,
          },
          {
            label: "Monto Pendiente",
            value: loading ? null : fmtCurrency(totalPending),
            icon: Clock,
            color: "text-warning",
            bg: "bg-warning/10",
            border: "border-warning/20",
            sub: loading ? "" : `${pending.length} pendientes de aprobación`,
          },
          {
            label: "Solicitudes Rechazadas",
            value: loading ? null : rejected.length,
            icon: XCircle,
            color: "text-danger",
            bg: "bg-danger/10",
            border: "border-danger/20",
            sub: loading ? "" : `${fmtCurrency(rejected.reduce((s, p) => s + (p.costoEstimado ?? 0), 0))} no ejecutado`,
          },
        ].map(({ label, value, icon: Icon, color, bg, border, sub }) => (
          <Card key={label} className={`${bg} ${border} border`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${color} mb-1`}>{label}</p>
                  {value === null
                    ? <Loader2 className="h-6 w-6 animate-spin text-muted mt-2" />
                    : <h3 className={`text-2xl font-bold ${color} truncate`}>{value}</h3>
                  }
                  <p className="text-xs text-muted mt-1">{sub}</p>
                </div>
                <div className={`p-3 ${bg} rounded-full ml-3 shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Approved cost by category */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" /> Gasto Aprobado por Categoría
            </CardTitle>
            <CardDescription>Distribución del monto aprobado según tipo de solicitud.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
            ) : catData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted text-sm">Sin solicitudes aprobadas</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false}
                      tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                      formatter={(v) => [fmtCurrency(Number(v ?? 0)), "Monto aprobado"]}
                    />
                    <Bar dataKey="value" name="Monto" radius={[4, 4, 0, 0]} maxBarSize={60} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" /> Solicitudes por Estado
            </CardTitle>
            <CardDescription>Cantidad de solicitudes según su estado de aprobación.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
            ) : purchases.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted text-sm">Sin solicitudes registradas</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Aprobadas",  value: approved.length,  fill: "#10b981" },
                      { name: "Pendientes", value: pending.length,   fill: "#f59e0b" },
                      { name: "Rechazadas", value: rejected.length,  fill: "#ef4444" },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" name="Solicitudes" radius={[4, 4, 0, 0]} maxBarSize={70}>
                      {[
                        { name: "Aprobadas", fill: "#10b981" },
                        { name: "Pendientes", fill: "#f59e0b" },
                        { name: "Rechazadas", fill: "#ef4444" },
                      ].map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full purchase requests table */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-lg">Detalle de Solicitudes de Compra</CardTitle>
          <CardDescription>
            {!loading && `${purchases.length} solicitudes registradas · Total estimado: ${fmtCurrency(totalAll)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-32 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
          ) : purchases.length === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-10 w-10 text-muted mx-auto mb-2" />
                <p className="text-muted text-sm">Sin solicitudes registradas</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted uppercase bg-surface-secondary/30 border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Categoría</th>
                    <th className="px-5 py-3 text-left font-semibold">Descripción</th>
                    <th className="px-5 py-3 text-left font-semibold">Cantidad</th>
                    <th className="px-5 py-3 text-left font-semibold">Costo Est.</th>
                    <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-right font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {purchases.map(p => (
                    <tr key={p.id} className="hover:bg-surface-secondary/20 transition-colors">
                      <td className="px-5 py-3 font-medium">{CATEGORY_LABELS[p.categoria] ?? p.categoria ?? "—"}</td>
                      <td className="px-5 py-3 text-muted max-w-xs truncate">{p.descripcion ?? "—"}</td>
                      <td className="px-5 py-3 text-muted">{p.cantidad}</td>
                      <td className="px-5 py-3 font-medium">{fmtCurrency(p.costoEstimado ?? 0)}</td>
                      <td className="px-5 py-3 text-muted">{fmt(p.fecha)}</td>
                      <td className="px-5 py-3 text-right">{estadoBadge(p.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
