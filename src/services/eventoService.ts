// Servicio de Monitoreo y Gestion de Eventos (ITIL Event Management, curso S15/S29).
// NO confundir con incidenciaService (mesa de ayuda) ni incidentService (infracciones).
// Habla con eventos-service a traves del proxy: /api/proxy/eventos -> API_URL/api/v1/eventos

export type NivelEvento = "INFORMACION" | "WARNING" | "ERROR" | "CRITICAL";
export type CategoriaEvento =
    | "INFRAESTRUCTURA"
    | "APLICACIONES"
    | "BASE_DATOS"
    | "REDES_COMUNICACIONES"
    | "SEGURIDAD"
    | "OTROS";

/**
 * Metadatos de cada nivel (tabla de la sesion S15/S29):
 * descripcion + accion esperada + estilos del badge.
 */
export const nivelMeta: Record<
    NivelEvento,
    { label: string; descripcion: string; accion: string; cls: string; dot: string }
> = {
    INFORMACION: {
        label: "Información",
        descripcion: "Evento normal",
        accion: "Registrar",
        cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
        dot: "bg-emerald-500",
    },
    WARNING: {
        label: "Warning",
        descripcion: "Riesgo potencial",
        accion: "Monitorear",
        cls: "bg-amber-500/15 text-amber-500 border-amber-500/30",
        dot: "bg-amber-500",
    },
    ERROR: {
        label: "Error",
        descripcion: "Falla parcial",
        accion: "Intervenir",
        cls: "bg-orange-500/15 text-orange-500 border-orange-500/30",
        dot: "bg-orange-500",
    },
    CRITICAL: {
        label: "Critical",
        descripcion: "Servicio interrumpido",
        accion: "Atención inmediata",
        cls: "bg-red-500/15 text-red-500 border-red-500/30",
        dot: "bg-red-500",
    },
};

export const categoriaEventoLabels: Record<CategoriaEvento, string> = {
    INFRAESTRUCTURA: "Infraestructura",
    APLICACIONES: "Aplicaciones",
    BASE_DATOS: "Base de datos",
    REDES_COMUNICACIONES: "Redes y comunicaciones",
    SEGURIDAD: "Seguridad",
    OTROS: "Otros",
};

export interface Evento {
    id: number;
    codigo: string;
    ocurridoEn: string;
    servicioOrigen: string;
    metrica: string;
    valor: number | null;
    mensaje: string | null;
    categoria: CategoriaEvento;
    nivel: NivelEvento;
    nivelDescripcion: string | null;
    accion: string | null;
    umbralAplicado: string | null;
    generaIncidente: boolean;
    incidenciaCodigo: string | null;
    createdAt: string;
}

export interface RegistrarEventoPayload {
    servicioOrigen: string;
    metrica: string;
    valor?: number;
    mensaje?: string;
    ocurridoEn?: string;
}

/** Politicas de deteccion activas: metrica -> { limiteInferior: nivel } (GET /politicas). */
export type PoliticasUmbral = Record<string, Record<string, NivelEvento>>;

async function parseOrThrow<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!res.ok) {
        let detail = text;
        try {
            const json = JSON.parse(text);
            detail = json.detail ?? json.message ?? json.error ?? text;
        } catch {}
        throw new Error(`[${res.status}] ${detail}`);
    }
    return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function getEventos(filtros?: {
    nivel?: NivelEvento;
    servicio?: string;
}): Promise<Evento[]> {
    const params = new URLSearchParams();
    if (filtros?.nivel) params.set("nivel", filtros.nivel);
    if (filtros?.servicio) params.set("servicio", filtros.servicio);
    const qs = params.toString();
    const res = await fetch(`/api/proxy/eventos${qs ? `?${qs}` : ""}`);
    return parseOrThrow<Evento[]>(res);
}

export async function registrarEvento(payload: RegistrarEventoPayload): Promise<Evento> {
    const res = await fetch("/api/proxy/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return parseOrThrow<Evento>(res);
}

/** Carga el timeline de ejemplo del material del curso, ya clasificado (demo en clase). */
export async function cargarDemoEventos(): Promise<Evento[]> {
    const res = await fetch("/api/proxy/eventos/demo", { method: "POST" });
    return parseOrThrow<Evento[]>(res);
}

export async function getPoliticas(): Promise<PoliticasUmbral> {
    const res = await fetch("/api/proxy/eventos/politicas");
    return parseOrThrow<PoliticasUmbral>(res);
}
