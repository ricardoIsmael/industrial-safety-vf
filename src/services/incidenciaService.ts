// Servicio de Incidencias TI (NO confundir con incidentService = infracciones de seguridad).
// Habla con incidencias-service a traves del proxy: /api/proxy/incidencias -> API_URL/api/v1/incidencias

export type Nivel = "ALTO" | "MEDIO" | "BAJO";
export type Prioridad = "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
export type Categoria =
    | "INFRAESTRUCTURA"
    | "APLICACIONES"
    | "BASE_DATOS"
    | "REDES_COMUNICACIONES"
    | "SEGURIDAD"
    | "OTROS";
export type EstadoIncidencia = "REGISTRADO" | "EN_ATENCION" | "RESUELTO" | "CERRADO";
export type SyncEstado = "NO_SINCRONIZADO" | "PENDIENTE" | "SINCRONIZADO" | "ERROR";

export interface Incidencia {
    id: number;
    codigo: string;
    reporterId: string;
    reporterName: string | null;
    reporterRole: string | null;
    categoria: Categoria;
    tipo: string | null;
    titulo: string;
    descripcion: string;
    impacto: Nivel;
    urgencia: Nivel;
    prioridad: Prioridad;
    evidenciaUrls: string[];
    estado: EstadoIncidencia;
    atendidoPor: string | null;
    aceptadoEn: string | null;
    resolucionDescripcion: string | null;
    resueltoBien: boolean | null;
    resueltoEn: string | null;
    freshserviceTicketId: number | null;
    freshserviceUrl: string | null;
    syncEstado: SyncEstado;
    createdAt: string;
    updatedAt: string;
}

export interface CrearIncidenciaPayload {
    categoria: Categoria;
    tipo?: string;
    titulo: string;
    descripcion: string;
    impacto: Nivel;
    urgencia: Nivel;
    evidenciaUrls?: string[];
    reporterName?: string;
    reporterRole?: string;
}

/** Matriz Impacto x Urgencia — espejo cliente del cálculo del backend (solo para preview). */
export function calcularPrioridad(impacto: Nivel, urgencia: Nivel): Prioridad {
    const m: Record<Nivel, Record<Nivel, Prioridad>> = {
        ALTO: { ALTO: "CRITICA", MEDIO: "ALTA", BAJO: "MEDIA" },
        MEDIO: { ALTO: "ALTA", MEDIO: "MEDIA", BAJO: "BAJA" },
        BAJO: { ALTO: "MEDIA", MEDIO: "BAJA", BAJO: "BAJA" },
    };
    return m[impacto][urgencia];
}

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

/** Sube un archivo a S3 vía URL prefirmada y devuelve la URL pública (fileUrl). */
export async function subirEvidencia(file: File): Promise<string> {
    const key = `incidencias/${Date.now()}-${file.name}`;
    const presignRes = await fetch(
        `/api/proxy/storage/upload-url?fileName=${encodeURIComponent(key)}&contentType=${encodeURIComponent(file.type)}`
    );
    if (!presignRes.ok) throw new Error("No se pudo obtener la URL de subida");
    const { uploadUrl, fileUrl } = await presignRes.json();
    const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
    if (!s3Res.ok) throw new Error("No se pudo subir la evidencia a S3");
    return fileUrl as string;
}

export async function crearIncidencia(
    reporterId: string,
    payload: CrearIncidenciaPayload
): Promise<Incidencia> {
    const res = await fetch("/api/proxy/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": reporterId },
        body: JSON.stringify(payload),
    });
    return parseOrThrow<Incidencia>(res);
}

export async function getMisIncidencias(reporterId: string): Promise<Incidencia[]> {
    const res = await fetch("/api/proxy/incidencias/mias", {
        headers: { "X-User-Id": reporterId },
    });
    if (!res.ok) return [];
    return res.json();
}

export async function getAllIncidencias(filters?: {
    estado?: EstadoIncidencia;
    prioridad?: Prioridad;
}): Promise<Incidencia[]> {
    const params = new URLSearchParams();
    if (filters?.estado) params.set("estado", filters.estado);
    if (filters?.prioridad) params.set("prioridad", filters.prioridad);
    const qs = params.toString();
    const res = await fetch(`/api/proxy/incidencias${qs ? `?${qs}` : ""}`);
    if (!res.ok) return [];
    return res.json();
}

export async function aceptarIncidencia(id: number, adminId: string): Promise<Incidencia> {
    const res = await fetch(`/api/proxy/incidencias/${id}/aceptar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-User-Id": adminId },
    });
    return parseOrThrow<Incidencia>(res);
}

export async function resolverIncidencia(
    id: number,
    adminId: string,
    body: { resolucionDescripcion: string; resueltoBien: boolean }
): Promise<Incidencia> {
    const res = await fetch(`/api/proxy/incidencias/${id}/resolver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-User-Id": adminId },
        body: JSON.stringify(body),
    });
    return parseOrThrow<Incidencia>(res);
}

/** Sincroniza la incidencia con Freshservice (async en el backend). */
export async function sincronizarIncidencia(id: number, adminId: string): Promise<Incidencia> {
    const res = await fetch(`/api/proxy/incidencias/${id}/sincronizar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-User-Id": adminId },
    });
    return parseOrThrow<Incidencia>(res);
}
