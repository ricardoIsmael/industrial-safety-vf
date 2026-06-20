"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileBarChart, RefreshCw, FileText, ExternalLink, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Stats {
  totalSolicitudes?: number;
  totalCompras?: number;
  pendientes?: number;
  aprobadas?: number;
  rechazadas?: number;
}

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  created?: string | null;
  url: string;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loadingJira, setLoadingJira] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadJira = () => {
    setLoadingJira(true);
    fetch("/api/jira?project=GDI")
      .then((r) => r.json())
      .then((d) => setIssues(Array.isArray(d.issues) ? d.issues : []))
      .catch(() => setIssues([]))
      .finally(() => setLoadingJira(false));
  };

  useEffect(() => {
    loadJira();
  }, []);

  const generarReporte = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/proxy/purchase/reports/compras", {
        headers: { "x-user-id": String(session?.dbId ?? "") },
      });
      if (!res.ok) throw new Error();
      const data: Stats = await res.json();
      setStats(data);
      toast.success("Reporte generado — traza registrada en Jira (GDI)");
      setTimeout(loadJira, 1500); // el ticket de info tarda un instante en aparecer
    } catch {
      toast.error("No se pudo generar el reporte");
    } finally {
      setGenerating(false);
    }
  };

  const statusBadge = (i: JiraIssue) => {
    const color =
      i.statusCategory === "done"
        ? "bg-success/15 text-success border-success/30"
        : i.statusCategory === "indeterminate"
        ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
        : "bg-blue-500/15 text-blue-400 border-blue-500/30";
    return <Badge className={`border ${color}`}>{i.status}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <FileBarChart className="h-8 w-8 text-emerald-500" /> Reportes Gerenciales
          </h1>
          <p className="text-muted">
            Genera el reporte ejecutivo de compras. Cada generación deja traza ITIL (Gestión de Información) en Jira · GDI.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={generating} onClick={generarReporte}>
          <FileText className="h-4 w-4 mr-2" /> {generating ? "Generando..." : "Generar reporte de compras"}
        </Button>
      </div>

      {/* Resultado del reporte */}
      {stats && (
        <Card className="bg-surface/60 border-border">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Reporte de Compras
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Stat label="Solicitudes" value={stats.totalSolicitudes ?? 0} />
              <Stat label="Total compras" value={`S/ ${(stats.totalCompras ?? 0).toFixed(2)}`} accent="text-emerald-400" />
              <Stat label="Pendientes" value={stats.pendientes ?? 0} accent="text-warning" />
              <Stat label="Aprobadas" value={stats.aprobadas ?? 0} accent="text-success" />
              <Stat label="Rechazadas" value={stats.rechazadas ?? 0} accent="text-danger" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trazabilidad en Jira (GDI) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" /> Trazabilidad en Jira — Gestión de Información (GDI)
          </h2>
          <Button variant="outline" size="sm" className="border-border" onClick={loadJira} disabled={loadingJira}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingJira ? "animate-spin" : ""}`} /> Actualizar
          </Button>
        </div>

        {loadingJira ? (
          <p className="text-muted">Cargando desde Jira...</p>
        ) : issues.length === 0 ? (
          <Card className="bg-surface/40 border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted">
                Aún no hay trazas. Genera un reporte para crear la primera (o configura las variables JIRA_* en el entorno).
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-surface/40 border-border">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-widest text-muted border-b border-border">
                    <th className="p-4">CÓDIGO</th>
                    <th className="p-4">REPORTE / ACCESO</th>
                    <th className="p-4">ESTADO</th>
                    <th className="p-4">JIRA</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((i) => (
                    <tr key={i.key} className="border-b border-border/50 hover:bg-surface-secondary/20">
                      <td className="p-4 font-mono text-xs">{i.key}</td>
                      <td className="p-4">{i.summary}</td>
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
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-4">
      <p className={`text-2xl font-bold ${accent ?? ""}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
