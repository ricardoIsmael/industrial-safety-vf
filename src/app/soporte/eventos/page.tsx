"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    Activity, Loader2, RefreshCw, PlayCircle, SlidersHorizontal, Zap, Info,
    AlertTriangle, AlertOctagon, CircleAlert,
} from "lucide-react";
import {
    cargarDemoEventos, getEventos, getPoliticas, nivelMeta, categoriaEventoLabels,
    type Evento, type NivelEvento, type PoliticasUmbral,
} from "@/services/eventoService";

const nivelIcono: Record<NivelEvento, typeof Info> = {
    INFORMACION: Info,
    WARNING: AlertTriangle,
    ERROR: CircleAlert,
    CRITICAL: AlertOctagon,
};

const NIVELES: NivelEvento[] = ["INFORMACION", "WARNING", "ERROR", "CRITICAL"];

export default function EventosPage() {
    const [items, setItems] = useState<Evento[]>([]);
    const [todos, setTodos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [demoLoading, setDemoLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros (Fase 1: clasificación de eventos, filtrable por nivel y servicio)
    const [nivel, setNivel] = useState<NivelEvento | "">("");
    const [servicio, setServicio] = useState("");

    // Políticas de detección (umbrales por métrica)
    const [politicas, setPoliticas] = useState<PoliticasUmbral | null>(null);
    const [verPoliticas, setVerPoliticas] = useState(false);

    const cargar = async () => {
        setLoading(true);
        setError(null);
        try {
            const lista = await getEventos({
                nivel: nivel || undefined,
                servicio: servicio || undefined,
            });
            setItems(lista);
            setTodos(nivel || servicio ? await getEventos() : lista);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar eventos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [nivel, servicio]);

    const handleDemo = async () => {
        setDemoLoading(true);
        setError(null);
        try {
            await cargarDemoEventos();
            await cargar();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar la demo");
        } finally {
            setDemoLoading(false);
        }
    };

    const togglePoliticas = async () => {
        if (!verPoliticas && !politicas) {
            try {
                setPoliticas(await getPoliticas());
            } catch (e) {
                setError(e instanceof Error ? e.message : "Error al cargar políticas");
            }
        }
        setVerPoliticas(v => !v);
    };

    const servicios = useMemo(
        () => Array.from(new Set(todos.map(e => e.servicioOrigen))).sort(),
        [todos]
    );

    const cuenta = (n: NivelEvento) => todos.filter(e => e.nivel === n).length;
    const escalados = todos.filter(e => e.generaIncidente).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestión de Eventos</h1>
                        <p className="text-sm text-muted">
                            Monitoreo y clasificación por umbrales — Información · Warning · Error · Critical
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={togglePoliticas}
                        className={cn("border-border gap-2", verPoliticas && "bg-primary/10 text-primary")}
                    >
                        <SlidersHorizontal className="h-4 w-4" /> Políticas
                    </Button>
                    <Button variant="outline" onClick={handleDemo} disabled={demoLoading} className="border-border gap-2">
                        {demoLoading
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <PlayCircle className="h-4 w-4" />} Simular timeline
                    </Button>
                    <Button variant="outline" size="icon" onClick={cargar} className="border-border">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Métricas por nivel (tabla de tipos de evento del curso) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {NIVELES.map(n => {
                    const Icono = nivelIcono[n];
                    const meta = nivelMeta[n];
                    const activo = nivel === n;
                    return (
                        <button key={n} onClick={() => setNivel(activo ? "" : n)} className="text-left">
                            <Card className={cn(
                                "p-4 border-border bg-surface/50 flex items-center gap-3 transition-colors cursor-pointer hover:bg-surface-secondary",
                                activo && "ring-1 ring-primary border-primary/50"
                            )}>
                                <span className={cn("h-9 w-9 rounded-lg border flex items-center justify-center shrink-0", meta.cls)}>
                                    <Icono className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-2xl font-bold leading-none">{cuenta(n)}</p>
                                    <p className="text-xs text-muted mt-1">{meta.label} — {meta.accion}</p>
                                </div>
                            </Card>
                        </button>
                    );
                })}
            </div>

            {/* Políticas de detección (umbrales por métrica, diapositiva S15/S29) */}
            {verPoliticas && politicas && (
                <Card className="p-4 border-border bg-surface/50 space-y-3">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold">Políticas de detección — umbrales por métrica</h2>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                        {Object.entries(politicas).map(([metrica, bandas]) => (
                            <div key={metrica} className="rounded-lg border border-border p-3">
                                <p className="text-sm font-medium mb-2">{metrica}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(bandas)
                                        .sort(([a], [b]) => Number(a) - Number(b))
                                        .map(([desde, niv]) => (
                                            <Badge key={desde} variant="outline" className={cn("border", nivelMeta[niv].cls)}>
                                                ≥ {Number(desde)} → {nivelMeta[niv].label}
                                            </Badge>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted">
                        La clasificación la decide el servidor: al valor observado se le aplica la banda de mayor
                        límite inferior que lo cubra. Los eventos Error y Critical escalan a incidencia automáticamente.
                    </p>
                </Card>
            )}

            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap">
                <Select value={nivel} onChange={e => setNivel(e.target.value as NivelEvento | "")} className="w-44">
                    <option value="">Todos los niveles</option>
                    {NIVELES.map(n => <option key={n} value={n}>{nivelMeta[n].label}</option>)}
                </Select>
                <Select value={servicio} onChange={e => setServicio(e.target.value)} className="w-52">
                    <option value="">Todos los servicios</option>
                    {servicios.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                {escalados > 0 && (
                    <span className="text-xs text-muted flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-purple-500" />
                        {escalados} evento{escalados === 1 ? "" : "s"} escalado{escalados === 1 ? "" : "s"} a incidencia
                    </span>
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Tabla de eventos (Fase 1: clasificación) */}
            {loading ? (
                <div className="flex items-center justify-center h-40 text-muted">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando eventos...
                </div>
            ) : items.length === 0 ? (
                <Card className="p-10 text-center text-muted border-border space-y-2">
                    <p>No hay eventos registrados{nivel || servicio ? " con esos filtros" : ""}.</p>
                    {!nivel && !servicio && (
                        <p className="text-xs">
                            Usa «Simular timeline» para cargar el escenario de ejemplo del curso
                            (CPU 72% → RAM 85% → Login fallido → BD lenta → Disco 95% → Servidor detenido).
                        </p>
                    )}
                </Card>
            ) : (
                <Card className="border-border bg-surface/50 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs text-muted">
                                <th className="px-4 py-3 font-medium">Hora</th>
                                <th className="px-4 py-3 font-medium">Servicio</th>
                                <th className="px-4 py-3 font-medium">Evento</th>
                                <th className="px-4 py-3 font-medium">Valor</th>
                                <th className="px-4 py-3 font-medium">Categoría</th>
                                <th className="px-4 py-3 font-medium">Nivel</th>
                                <th className="px-4 py-3 font-medium">Acción</th>
                                <th className="px-4 py-3 font-medium">Incidente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(ev => {
                                const meta = nivelMeta[ev.nivel];
                                return (
                                    <tr key={ev.id} className="border-b border-border/50 last:border-0 hover:bg-surface-secondary/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-muted">
                                            {new Date(ev.ocurridoEn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium">{ev.servicioOrigen}</td>
                                        <td className="px-4 py-3 min-w-56">
                                            <p className="font-medium">{ev.mensaje ?? ev.metrica}</p>
                                            <p className="text-xs text-muted">
                                                {ev.codigo}{ev.umbralAplicado ? ` · ${ev.umbralAplicado}` : ""}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted">
                                            {ev.valor != null ? ev.valor : "—"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Badge variant="outline" className="border border-border text-muted">
                                                {categoriaEventoLabels[ev.categoria] ?? ev.categoria}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Badge variant="outline" className={cn("border gap-1.5", meta.cls)}>
                                                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                                                {meta.label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted">{ev.accion ?? meta.accion}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {ev.generaIncidente ? (
                                                <Badge variant="outline" className="border border-purple-500/30 bg-purple-500/10 text-purple-500 gap-1">
                                                    <Zap className="h-3 w-3" />
                                                    {ev.incidenciaCodigo ?? "Sí"}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted">No</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
