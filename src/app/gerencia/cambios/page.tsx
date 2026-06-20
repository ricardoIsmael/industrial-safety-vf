"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, RefreshCw, Plus, ExternalLink, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  priority?: string | null;
  issueType?: string | null;
  labels: string[];
  created?: string | null;
  url: string;
}

const TIPOS = [
  { value: "Estandar", label: "Estándar", hint: "Repetitivo y de bajo riesgo (pre-aprobado)." },
  { value: "Normal", label: "Normal", hint: "Nueva funcionalidad; requiere aprobación." },
  { value: "Emergencia", label: "Emergencia", hint: "Corrección crítica; aprobación express." },
];
const CATEGORIAS = ["Infraestructura", "Aplicaciones y BD", "Documentación", "Calendario"];
const PRIORIDADES = ["Baja", "Media", "Alta"];
const NIVELES = ["Bajo", "Medio", "Alto"];

export default function ControlCambiosPage() {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [filter, setFilter] = useState("Todos");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    proyecto: "",
    responsable: "",
    tipo: "Normal",
    categoria: "Aplicaciones y BD",
    prioridad: "Media",
    titulo: "",
    descripcion: "",
    areaAfectada: "",
    impacto: "Medio",
    nivelRiesgo: "Medio",
    riesgo: "",
    planPruebas: "",
    planRollback: "",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/jira?project=CON")
      .then((r) => r.json())
      .then((d) => setIssues(Array.isArray(d.issues) ? d.issues : []))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const statuses = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((i) => {
      counts[i.status] = (counts[i.status] || 0) + 1;
    });
    return counts;
  }, [issues]);

  const enProceso = issues.filter((i) => i.statusCategory === "indeterminate").length;
  const completados = issues.filter((i) => i.statusCategory === "done").length;
  const pct = issues.length ? Math.round((completados / issues.length) * 100) : 0;

  const filtered = filter === "Todos" ? issues : issues.filter((i) => i.status === filter);

  const submit = async () => {
    if (!form.titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSubmitting(true);
    const descripcion = [
      `Proyecto: ${form.proyecto || "—"}`,
      `Responsable (TIC/Área): ${form.responsable || "—"}`,
      `Tipo de cambio: ${form.tipo}`,
      `Categoría: ${form.categoria}  |  Prioridad: ${form.prioridad}`,
      `Área afectada: ${form.areaAfectada || "—"}`,
      `Impacto: ${form.impacto}  |  Nivel de riesgo: ${form.nivelRiesgo}`,
      "",
      `Descripción: ${form.descripcion || "—"}`,
      `Riesgo: ${form.riesgo || "—"}`,
      `Plan de pruebas: ${form.planPruebas || "—"}`,
      `Plan de rollback: ${form.planRollback || "—"}`,
    ].join("\n");

    try {
      const res = await fetch("/api/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: "CON",
          summary: form.titulo,
          description: descripcion,
          labels: [`Cambio-${form.tipo}`, form.categoria, `Prioridad-${form.prioridad}`],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "error");
      toast.success(`Plan de cambio registrado en Jira: ${data.key}`);
      setForm({ ...form, titulo: "", descripcion: "", areaAfectada: "", riesgo: "", planPruebas: "", planRollback: "" });
      setView("list");
      load();
    } catch (e: any) {
      toast.error("No se pudo registrar en Jira (¿variables JIRA_* configuradas?)");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const statusBadge = (i: JiraIssue) => {
    const color =
      i.statusCategory === "done"
        ? "bg-success/15 text-success border-success/30"
        : i.statusCategory === "indeterminate"
        ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
        : "bg-blue-500/15 text-blue-400 border-blue-500/30";
    return <Badge className={`border ${color}`}>{i.status}</Badge>;
  };

  // ───────── Formulario ─────────
  if (view === "form") {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <p className="text-xs tracking-widest text-primary/70 mb-1">DIRECCIÓN · CONTROL DE CAMBIOS</p>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo plan de cambio</h1>
          <p className="text-muted">Completa el formulario del plan de control de cambios (se registra en Jira · CON).</p>
        </div>

        <Card className="bg-surface/60 border-border">
          <CardContent className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Proyecto"><input className={inputCls} value={form.proyecto} onChange={(e) => set("proyecto", e.target.value)} placeholder="Plataforma..." /></Field>
              <Field label="Responsable (TIC / Área)"><input className={inputCls} value={form.responsable} onChange={(e) => set("responsable", e.target.value)} /></Field>
            </div>

            <Field label="Tipo de cambio *">
              <div className="grid sm:grid-cols-3 gap-3">
                {TIPOS.map((t) => (
                  <button key={t.value} type="button" onClick={() => set("tipo", t.value)}
                    className={`text-left rounded-lg border p-3 transition ${form.tipo === t.value ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-surface-secondary/40"}`}>
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-muted mt-1">{t.hint}</p>
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Categoría (alcance) *">
                <select className={inputCls} value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Prioridad">
                <select className={inputCls} value={form.prioridad} onChange={(e) => set("prioridad", e.target.value)}>
                  {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Cambio solicitado (título) *"><input className={inputCls} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Resume el cambio en una frase" /></Field>
            <Field label="Descripción"><textarea className={`${inputCls} min-h-[90px]`} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} /></Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Área afectada"><input className={inputCls} value={form.areaAfectada} onChange={(e) => set("areaAfectada", e.target.value)} /></Field>
              <Field label="Impacto">
                <select className={inputCls} value={form.impacto} onChange={(e) => set("impacto", e.target.value)}>{NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </Field>
              <Field label="Nivel de riesgo">
                <select className={inputCls} value={form.nivelRiesgo} onChange={(e) => set("nivelRiesgo", e.target.value)}>{NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </Field>
            </div>

            <Field label="Riesgo"><textarea className={`${inputCls} min-h-[70px]`} value={form.riesgo} onChange={(e) => set("riesgo", e.target.value)} /></Field>
            <Field label="Plan de pruebas"><textarea className={`${inputCls} min-h-[70px]`} value={form.planPruebas} onChange={(e) => set("planPruebas", e.target.value)} placeholder="Tipo de prueba, responsable, evidencia..." /></Field>
            <Field label="Plan de rollback"><textarea className={`${inputCls} min-h-[70px]`} value={form.planRollback} onChange={(e) => set("planRollback", e.target.value)} placeholder="Cómo revertir si algo falla..." /></Field>

            <div className="flex gap-3 pt-2">
              <Button className="bg-primary text-black hover:bg-primary/90" disabled={submitting} onClick={submit}>
                {submitting ? "Registrando..." : "Registrar cambio"}
              </Button>
              <Button variant="ghost" onClick={() => setView("list")}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───────── Lista ─────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-widest text-primary/70 mb-1">DIRECCIÓN · CONTROL DE CAMBIOS</p>
          <h1 className="text-3xl font-bold tracking-tight">Control de Cambios</h1>
          <p className="text-muted">{issues.length} cambios registrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Sincronizar con Jira
          </Button>
          <Button className="bg-primary text-black hover:bg-primary/90" onClick={() => setView("form")}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo plan de cambio
          </Button>
        </div>
      </div>

      {/* Stats + distribución */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total de cambios" value={issues.length} />
          <Stat label="En proceso" value={enProceso} />
          <Stat label="% Completado" value={`${pct}%`} accent="text-success" />
        </div>
        <Card className="bg-surface/40 border-border">
          <CardContent className="p-4">
            <p className="text-xs tracking-widest text-muted mb-3">DISTRIBUCIÓN POR ESTADO</p>
            {Object.keys(statuses).length === 0 ? (
              <p className="text-sm text-muted">Sin datos.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(statuses).map(([st, n]) => (
                  <div key={st} className="flex items-center gap-3 text-sm">
                    <span className="w-32 truncate text-muted">{st}</span>
                    <div className="flex-1 h-2 rounded bg-surface-secondary/50">
                      <div className="h-2 rounded bg-primary" style={{ width: `${(n / issues.length) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {["Todos", ...Object.keys(statuses)].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <Card className="bg-surface/40 border-border">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted">Cargando desde Jira...</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-muted">No hay cambios. Crea uno con "Nuevo plan de cambio".</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs tracking-widest text-muted border-b border-border">
                  <th className="p-4">CÓDIGO</th>
                  <th className="p-4">CAMBIO</th>
                  <th className="p-4">ETIQUETAS</th>
                  <th className="p-4">ESTADO</th>
                  <th className="p-4">JIRA</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.key} className="border-b border-border/50 hover:bg-surface-secondary/20">
                    <td className="p-4 font-mono text-xs">{i.key}</td>
                    <td className="p-4">{i.summary}</td>
                    <td className="p-4 text-xs text-muted">{i.labels.join(", ") || "—"}</td>
                    <td className="p-4">{statusBadge(i)}</td>
                    <td className="p-4">
                      <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        {i.key} <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs tracking-wide text-muted mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <Card className="bg-surface/40 border-border">
      <CardContent className="p-4">
        <p className={`text-3xl font-bold ${accent ?? ""}`}>{value}</p>
        <p className="text-xs text-muted mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
