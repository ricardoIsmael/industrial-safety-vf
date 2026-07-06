"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, AlertTriangle, Activity, BookOpen, Loader2, RefreshCw,
    Timer, TimerOff, CheckCircle2, Inbox, ArrowRight, Zap,
} from "lucide-react";
import { prioridadClasses } from "@/components/incidencias/reportar-incidente-button";
import { formatDuracion, slaEstado } from "@/features/incidencias/sla";
import { getAllIncidencias, type Incidencia } from "@/services/incidenciaService";
import { getEventos, nivelMeta, type Evento, type NivelEvento } from "@/services/eventoService";

const NIVELES: NivelEvento[] = ["INFORMACION", "WARNING", "ERROR", "CRITICAL"];

export default function SoporteDashboardPage() {
    const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tick para los contadores SLA en vivo.
    const [ahora, setAhora] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setAhora(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const cargar = async () => {
        setLoading(true);
        setError(null);
        try {
            // Eventos puede no estar desplegado aún: no debe tumbar el dashboard.
            const [incs, evs] = await Promise.all([
                getAllIncidencias(),
                getEventos().catch(() => [] as Evento[]),
            ]);
            setIncidencias(incs);
            setEventos(evs);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar el dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    // ── KPIs ─────────────────────────────────────────────────────────────────
    const abiertas = incidencias.filter(i => i.estado === "REGISTRADO" || i.estado === "EN_ATENCION");
    const slaVencidasAbiertas = abiertas.filter(i => slaEstado(i, ahora).tipo === "vencido");
    const resueltasConSla = incidencias.filter(i => i.slaCumplido !== null && i.slaCumplido !== undefined);
    const cumplimiento = resueltasConSla.length > 0
        ? Math.round((resueltasConSla.filter(i => i.slaCumplido).length / resueltasConSla.length) * 100)
        : null;
    const eventosGraves = eventos.filter(e => e.nivel === "ERROR" || e.nivel === "CRITICAL").length;

    // Incidencias abiertas ordenadas por urgencia del SLA (vencidas primero, luego menor tiempo restante).
    const enSeguimiento = useMemo(() => {
        const conSla = abiertas.filter(i => i.slaVencimiento);
        return [...conSla].sort((a, b) =>
            new Date(a.slaVencimiento!).getTime() - new Date(b.slaVencimiento!).getTime()
        ).slice(0, 6);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incidencias]);

    const ultimosEventos = eventos.slice(0, 5);

    const kpis = [
        { label: "Incidencias abiertas", value: abiertas.length, icon: Inbox, cls: "text-primary" },
        { label: "SLA vencidos", value: slaVencidasAbiertas.length, icon: TimerOff, cls: slaVencidasAbiertas.length > 0 ? "text-red-500" : "text-muted" },
        { label: "Cumplimiento SLA", value: cumplimiento !== null ? `${cumplimiento}%` : "—", icon: CheckCircle2, cls: cumplimiento !== null && cumplimiento < 80 ? "text-amber-500" : "text-emerald-500" },
        { label: "Eventos Error/Critical", value: eventosGraves, icon: Zap, cls: eventosGraves > 0 ? "text-orange-500" : "text-muted" },
    ];

    const modulos = [
        { name: "Incidencias TI", href: "/soporte/incidencias", icon: AlertTriangle, desc: "Mesa de ayuda con SLA por prioridad" },
        { name: "Eventos", href: "/soporte/eventos", icon: Activity, desc: "Monitoreo y clasificación por umbrales" },
        { name: "Base de Conocimiento", href: "/soporte/conocimiento", icon: BookOpen, desc: "Planes, políticas y runbooks" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Soporte TI</h1>
                        <p className="text-sm text-muted">Incidencias, eventos y cumplimiento de SLA en un solo vistazo</p>
                    </div>
                </div>
                <Button variant="outline" size="icon" onClick={cargar} className="border-border">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {loading ? (
                <div className="flex items-center justify-center h-40 text-muted">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando dashboard...
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {kpis.map(k => (
                            <Card key={k.label} className="p-4 border-border bg-surface/50 flex items-center gap-3">
                                <k.icon className={cn("h-6 w-6 shrink-0", k.cls)} />
                                <div className="min-w-0">
                                    <p className="text-2xl font-bold leading-none">{k.value}</p>
                                    <p className="text-xs text-muted mt-1">{k.label}</p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* SLA en curso (contadores en vivo) */}
                        <Card className="p-4 border-border bg-surface/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-primary" /> SLA en curso (RTO por incidencia)
                                </h2>
                                <Link href="/soporte/incidencias" className="text-xs text-primary flex items-center gap-1 hover:underline">
                                    Ver tablero <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                            {enSeguimiento.length === 0 ? (
                                <p className="text-sm text-muted py-6 text-center">No hay incidencias abiertas con SLA. 🎉</p>
                            ) : (
                                <div className="space-y-2">
                                    {enSeguimiento.map(inc => {
                                        const s = slaEstado(inc, ahora);
                                        const vencida = s.tipo === "vencido";
                                        const enRiesgo = s.tipo === "en-curso" && s.enRiesgo;
                                        // Progreso del plazo consumido (0-100).
                                        const totalMs = (inc.slaMinutos ?? 0) * 60000;
                                        const consumido = totalMs > 0 && s.tipo === "en-curso"
                                            ? Math.min(100, Math.round(((totalMs - s.restanteMs) / totalMs) * 100))
                                            : 100;
                                        return (
                                            <div key={inc.id} className="rounded-lg border border-border p-3 space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className={cn("border", prioridadClasses[inc.prioridad])}>
                                                        {inc.prioridad}
                                                    </Badge>
                                                    <span className="text-sm font-medium truncate flex-1">{inc.titulo}</span>
                                                    <span className={cn("text-xs font-semibold whitespace-nowrap",
                                                        vencida ? "text-red-500 animate-pulse" : enRiesgo ? "text-amber-500" : "text-sky-500")}>
                                                        {s.tipo === "en-curso" && `${formatDuracion(s.restanteMs)} restantes`}
                                                        {vencida && s.tipo === "vencido" && `vencido hace ${formatDuracion(s.excedidoMs)}`}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all",
                                                            vencida ? "bg-red-500" : enRiesgo ? "bg-amber-500" : "bg-sky-500")}
                                                        style={{ width: `${consumido}%` }}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-muted">
                                                    {inc.codigo} · SLA {inc.slaMinutos} min · {inc.estado === "REGISTRADO" ? "sin aceptar" : "en atención"}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {/* Eventos recientes por nivel */}
                        <Card className="p-4 border-border bg-surface/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" /> Monitoreo de eventos
                                </h2>
                                <Link href="/soporte/eventos" className="text-xs text-primary flex items-center gap-1 hover:underline">
                                    Ver tablero <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {NIVELES.map(n => (
                                    <div key={n} className={cn("rounded-lg border p-2 text-center", nivelMeta[n].cls)}>
                                        <p className="text-lg font-bold leading-none">{eventos.filter(e => e.nivel === n).length}</p>
                                        <p className="text-[10px] mt-1">{nivelMeta[n].label}</p>
                                    </div>
                                ))}
                            </div>
                            {ultimosEventos.length === 0 ? (
                                <p className="text-sm text-muted py-4 text-center">Sin eventos registrados.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {ultimosEventos.map(ev => (
                                        <div key={ev.id} className="flex items-center gap-2 text-sm border-b border-border/50 last:border-0 pb-1.5 last:pb-0">
                                            <span className={cn("h-2 w-2 rounded-full shrink-0", nivelMeta[ev.nivel].dot)} />
                                            <span className="truncate flex-1">{ev.mensaje ?? ev.metrica}</span>
                                            <span className="text-[11px] text-muted whitespace-nowrap">{ev.servicioOrigen}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Accesos a los módulos */}
                    <div className="grid gap-3 md:grid-cols-3">
                        {modulos.map(m => (
                            <Link key={m.href} href={m.href}>
                                <Card className="p-4 border-border bg-surface/50 h-full hover:bg-surface-secondary/60 transition-colors cursor-pointer flex items-center gap-3">
                                    <m.icon className="h-5 w-5 text-primary shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm">{m.name}</p>
                                        <p className="text-xs text-muted truncate">{m.desc}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted ml-auto shrink-0" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
