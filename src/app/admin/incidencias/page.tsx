"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    AlertTriangle, Loader2, X, CheckCircle2, PlayCircle, Paperclip, RefreshCw,
    CloudUpload, ExternalLink,
} from "lucide-react";
import { prioridadClasses } from "@/components/incidencias/reportar-incidente-button";
import {
    aceptarIncidencia, getAllIncidencias, resolverIncidencia, sincronizarIncidencia,
    categoriaLabels, type EstadoIncidencia, type Incidencia,
} from "@/services/incidenciaService";

const estadoMeta: Record<string, { label: string; cls: string }> = {
    REGISTRADO: { label: "Registrado", cls: "bg-slate-500/15 text-slate-500 border-slate-500/30" },
    EN_ATENCION: { label: "En atención", cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
    RESUELTO: { label: "Resuelto", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    CERRADO: { label: "Cerrado", cls: "bg-muted/20 text-muted border-border" },
};

export default function AdminIncidenciasPage() {
    const { data: session } = useSession();
    const adminId = session?.keycloakId as string | undefined;

    const [items, setItems] = useState<Incidencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<EstadoIncidencia | "">("");
    const [processing, setProcessing] = useState<number | null>(null);

    // Modal de resolución
    const [resolviendo, setResolviendo] = useState<Incidencia | null>(null);
    const [resolText, setResolText] = useState("");
    const [resueltoBien, setResueltoBien] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargar = async () => {
        setLoading(true);
        try {
            setItems(await getAllIncidencias(filtro ? { estado: filtro } : undefined));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [filtro]);

    const handleAceptar = async (id: number) => {
        if (!adminId) return;
        setProcessing(id);
        try {
            await aceptarIncidencia(id, adminId);
            await cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al aceptar");
        } finally {
            setProcessing(null);
        }
    };

    const handleSincronizar = async (id: number) => {
        if (!adminId) return;
        setProcessing(id);
        setError(null);
        try {
            await sincronizarIncidencia(id, adminId);
            await cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al sincronizar");
        } finally {
            setProcessing(null);
        }
    };

    const handleResolver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminId || !resolviendo) return;
        if (!resolText.trim()) { setError("Describe cómo se solucionó"); return; }
        setProcessing(resolviendo.id);
        setError(null);
        try {
            await resolverIncidencia(resolviendo.id, adminId, {
                resolucionDescripcion: resolText.trim(),
                resueltoBien,
            });
            setResolviendo(null);
            setResolText("");
            setResueltoBien(true);
            await cargar();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al resolver");
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Incidencias TI</h1>
                        <p className="text-sm text-muted">Atención de incidentes por prioridad</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filtro} onChange={e => setFiltro(e.target.value as EstadoIncidencia | "")} className="w-44">
                        <option value="">Todos los estados</option>
                        <option value="REGISTRADO">Registrado</option>
                        <option value="EN_ATENCION">En atención</option>
                        <option value="RESUELTO">Resuelto</option>
                        <option value="CERRADO">Cerrado</option>
                    </Select>
                    <Button variant="outline" size="icon" onClick={cargar} className="border-border">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Lista */}
            {loading ? (
                <div className="flex items-center justify-center h-40 text-muted">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando incidencias...
                </div>
            ) : items.length === 0 ? (
                <Card className="p-10 text-center text-muted border-border">No hay incidencias.</Card>
            ) : (
                <div className="space-y-3">
                    {items.map(inc => (
                        <Card key={inc.id} className="p-4 border-border bg-surface/50">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className={cn("border", prioridadClasses[inc.prioridad])}>
                                            {inc.prioridad}
                                        </Badge>
                                        <Badge variant="outline" className={cn("border", estadoMeta[inc.estado]?.cls)}>
                                            {estadoMeta[inc.estado]?.label ?? inc.estado}
                                        </Badge>
                                        <Badge variant="outline" className="border border-border text-muted">
                                            {categoriaLabels[inc.categoria] ?? inc.categoria}
                                        </Badge>
                                        <span className="text-xs text-muted">{inc.codigo}</span>
                                    </div>
                                    <h3 className="font-bold">{inc.titulo}</h3>
                                    <p className="text-sm text-muted line-clamp-2">{inc.descripcion}</p>
                                    <p className="text-xs text-muted">
                                        {inc.tipo} · reportado por {inc.reporterName ?? "—"}
                                        {inc.reporterRole ? ` (${inc.reporterRole})` : ""}
                                    </p>
                                    {(inc.evidenciaUrls?.length ?? 0) > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap pt-1">
                                            {inc.evidenciaUrls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                                    <Paperclip className="h-3 w-3" /> Evidencia {i + 1}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {inc.estado === "RESUELTO" && inc.resolucionDescripcion && (
                                        <p className="text-xs text-emerald-600 pt-1">
                                            ✓ {inc.resueltoBien ? "Resuelto correctamente" : "Cerrado sin éxito"}: {inc.resolucionDescripcion}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    {inc.estado === "REGISTRADO" && (
                                        <Button size="sm" className="gap-2" disabled={processing === inc.id}
                                            onClick={() => handleAceptar(inc.id)}>
                                            {processing === inc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                                            Aceptar
                                        </Button>
                                    )}
                                    {inc.estado === "EN_ATENCION" && (
                                        <Button size="sm" variant="outline" className="gap-2 border-border"
                                            onClick={() => { setResolviendo(inc); setError(null); }}>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Resolver
                                        </Button>
                                    )}

                                    {/* Sincronización con Freshservice */}
                                    {inc.syncEstado === "SINCRONIZADO" && inc.freshserviceUrl ? (
                                        <a href={inc.freshserviceUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                                            <ExternalLink className="h-3 w-3" /> Jira {inc.freshserviceUrl.split("/").pop()}
                                        </a>
                                    ) : inc.syncEstado === "PENDIENTE" ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Sincronizando…
                                        </span>
                                    ) : (
                                        <Button size="sm" variant="outline" className="gap-2 border-border"
                                            disabled={processing === inc.id}
                                            onClick={() => handleSincronizar(inc.id)}>
                                            <CloudUpload className="h-4 w-4 text-blue-500" />
                                            {inc.syncEstado === "ERROR" ? "Reintentar sync" : "Sincronizar"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de resolución */}
            {resolviendo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="font-bold text-lg">Resolver incidencia</h2>
                            <Button variant="ghost" size="icon" onClick={() => setResolviendo(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <form onSubmit={handleResolver} className="p-4 space-y-3">
                            <p className="text-sm text-muted">{resolviendo.codigo} — {resolviendo.titulo}</p>
                            <div>
                                <label className="text-xs font-medium text-muted">¿Cómo se solucionó?</label>
                                <textarea
                                    className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={resolText} onChange={e => setResolText(e.target.value)}
                                    placeholder="Describe la solución aplicada (diagnóstico, acción, resultado)" maxLength={2000}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted">¿Quedó resuelto correctamente?</label>
                                <Select value={resueltoBien ? "si" : "no"} onChange={e => setResueltoBien(e.target.value === "si")}>
                                    <option value="si">Sí, quedó bien</option>
                                    <option value="no">No, se cerró sin éxito</option>
                                </Select>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" className="border-border" onClick={() => setResolviendo(null)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="gap-2" disabled={processing === resolviendo.id}>
                                    {processing === resolviendo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Marcar resuelta
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
