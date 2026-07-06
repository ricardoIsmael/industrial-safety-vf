// Utilidades del SLA de resolución (RTO de atención, curso S16/S31).
// El backend fija slaVencimiento al registrar; aquí solo se calcula/presenta el contador.

import type { Incidencia } from "@/services/incidenciaService";

/** Milisegundos restantes hasta el vencimiento del SLA (negativo = vencido). Null si no tiene SLA. */
export function slaRestanteMs(slaVencimiento: string | null, ahora: number): number | null {
    if (!slaVencimiento) return null;
    return new Date(slaVencimiento).getTime() - ahora;
}

/** Formatea una duración en ms como "2d 3h", "1h 23m" o "45m" (siempre positiva). */
export function formatDuracion(ms: number): string {
    const total = Math.max(0, Math.floor(Math.abs(ms) / 60000)); // minutos
    const d = Math.floor(total / 1440);
    const h = Math.floor((total % 1440) / 60);
    const m = total % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
    return `${m}m`;
}

export type SlaEstado =
    | { tipo: "sin-sla" }
    | { tipo: "en-curso"; restanteMs: number; enRiesgo: boolean }
    | { tipo: "vencido"; excedidoMs: number }
    | { tipo: "cumplido" }
    | { tipo: "incumplido"; justificacion: string | null };

/** Estado del SLA de una incidencia para pintarlo en el tablero/dashboard. */
export function slaEstado(inc: Incidencia, ahora: number): SlaEstado {
    if (!inc.slaVencimiento) return { tipo: "sin-sla" };

    // Ya cerrada: el veredicto quedó registrado por el backend.
    if (inc.estado === "RESUELTO" || inc.estado === "CERRADO") {
        if (inc.slaCumplido === true) return { tipo: "cumplido" };
        if (inc.slaCumplido === false) return { tipo: "incumplido", justificacion: inc.demoraJustificacion };
        return { tipo: "sin-sla" };
    }

    const restante = slaRestanteMs(inc.slaVencimiento, ahora)!;
    if (restante <= 0) return { tipo: "vencido", excedidoMs: -restante };

    // En riesgo: queda menos del 25% del plazo o menos de 15 minutos.
    const totalMs = (inc.slaMinutos ?? 0) * 60000;
    const enRiesgo = restante < 15 * 60000 || (totalMs > 0 && restante < totalMs * 0.25);
    return { tipo: "en-curso", restanteMs: restante, enRiesgo };
}
