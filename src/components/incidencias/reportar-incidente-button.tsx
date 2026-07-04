"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    AlertTriangle, X, Loader2, Plus, Paperclip, ListChecks, Send,
} from "lucide-react";
import { tiposParaRol } from "@/features/incidencias/catalog";
import {
    crearIncidencia, getMisIncidencias, subirEvidencia,
    type Incidencia, type Prioridad,
} from "@/services/incidenciaService";

export const prioridadClasses: Record<Prioridad, string> = {
    CRITICA: "bg-red-500/15 text-red-500 border-red-500/30",
    ALTA: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    MEDIA: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    BAJA: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

const estadoLabel: Record<string, string> = {
    REGISTRADO: "Registrado",
    EN_ATENCION: "En atención",
    RESUELTO: "Resuelto",
    CERRADO: "Cerrado",
};

interface Props {
    /** Rol del usuario (define el catálogo de tipos). Ej. "TRABAJADOR". */
    role: string;
    className?: string;
}

export function ReportarIncidenteButton({ role, className }: Props) {
    const { data: session } = useSession();
    const reporterId = session?.keycloakId as string | undefined;
    const reporterName = session?.user?.name ?? "";

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<"form" | "mias">("form");
    const tipos = tiposParaRol(role);

    // Form
    const [tipoIdx, setTipoIdx] = useState(0);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    // Mis incidencias
    const [mias, setMias] = useState<Incidencia[]>([]);
    const [loadingMias, setLoadingMias] = useState(false);

    const resetForm = () => {
        setTipoIdx(0); setTitulo(""); setDescripcion("");
        setFiles([]); setError(null);
    };

    const cargarMias = async () => {
        if (!reporterId) return;
        setLoadingMias(true);
        try {
            setMias(await getMisIncidencias(reporterId));
        } finally {
            setLoadingMias(false);
        }
    };

    useEffect(() => {
        if (open && view === "mias") cargarMias();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, view]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reporterId) { setError("Sesión no válida"); return; }
        if (!titulo.trim() || !descripcion.trim()) { setError("Título y descripción son obligatorios"); return; }
        setSubmitting(true);
        setError(null);
        try {
            const evidenciaUrls: string[] = [];
            for (const f of files) {
                evidenciaUrls.push(await subirEvidencia(f));
            }
            const seleccion = tipos[tipoIdx];
            await crearIncidencia(reporterId, {
                categoria: seleccion.categoria,
                tipo: seleccion.tipo,
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                evidenciaUrls,
                reporterName,
                reporterRole: role,
            });
            resetForm();
            setOkMsg("Incidencia registrada. El equipo de TI fue notificado.");
            setView("mias");
            await cargarMias();
            setTimeout(() => setOkMsg(null), 4000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar la incidencia");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className={cn("gap-2 border-border", className)}
                onClick={() => { setOpen(true); setView("form"); setOkMsg(null); }}
            >
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Reportar incidente
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                <h2 className="font-bold text-lg">Gestión de Incidencias TI</h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-2 border-b border-border">
                            <button
                                onClick={() => setView("form")}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium",
                                    view === "form" ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-secondary")}
                            >
                                <Plus className="h-4 w-4" /> Reportar
                            </button>
                            <button
                                onClick={() => setView("mias")}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium",
                                    view === "mias" ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-secondary")}
                            >
                                <ListChecks className="h-4 w-4" /> Mis incidencias
                            </button>
                        </div>

                        {okMsg && (
                            <div className="m-4 mb-0 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm">{okMsg}</div>
                        )}

                        {view === "form" ? (
                            <form onSubmit={handleSubmit} className="p-4 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-muted">Tipo de incidente</label>
                                    <Select value={tipoIdx} onChange={e => setTipoIdx(Number(e.target.value))}>
                                        {tipos.map((t, i) => <option key={i} value={i}>{t.tipo}</option>)}
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted">Título</label>
                                    <Input value={titulo} onChange={e => setTitulo(e.target.value)}
                                        placeholder="Resumen corto del problema" maxLength={120} />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted">Descripción</label>
                                    <textarea
                                        className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={descripcion} onChange={e => setDescripcion(e.target.value)}
                                        placeholder="¿Qué pasó? ¿Qué estabas haciendo?" maxLength={2000}
                                    />
                                </div>

                                <p className="text-[11px] text-muted">
                                    El equipo de TI clasificará la prioridad de tu incidencia automáticamente.
                                </p>

                                <div>
                                    <label className="text-xs font-medium text-muted flex items-center gap-1">
                                        <Paperclip className="h-3 w-3" /> Evidencia (imágenes, opcional)
                                    </label>
                                    <input type="file" accept="image/*" multiple
                                        className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-surface-secondary file:text-foreground"
                                        onChange={e => setFiles(Array.from(e.target.files ?? []))} />
                                    {files.length > 0 && (
                                        <p className="text-[11px] text-muted mt-1">{files.length} archivo(s) seleccionado(s)</p>
                                    )}
                                </div>

                                {error && <p className="text-sm text-red-500">{error}</p>}

                                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    {submitting ? "Registrando..." : "Registrar incidencia"}
                                </Button>
                            </form>
                        ) : (
                            <div className="p-4 space-y-2">
                                {loadingMias ? (
                                    <div className="flex items-center justify-center py-8 text-muted">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando...
                                    </div>
                                ) : mias.length === 0 ? (
                                    <p className="text-sm text-muted text-center py-8">Aún no has reportado incidencias.</p>
                                ) : (
                                    mias.map(inc => (
                                        <div key={inc.id} className="rounded-lg border border-border p-3 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-sm truncate">{inc.titulo}</span>
                                                <Badge variant="outline" className={cn("border shrink-0", prioridadClasses[inc.prioridad])}>
                                                    {inc.prioridad}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted">{inc.codigo} · {estadoLabel[inc.estado] ?? inc.estado}</p>
                                            {inc.estado === "RESUELTO" && inc.resolucionDescripcion && (
                                                <p className="text-xs text-emerald-600">Solución: {inc.resolucionDescripcion}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
