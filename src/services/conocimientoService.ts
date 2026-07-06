// Base de Conocimiento (ITIL Knowledge Management, curso S16/S31).
// Aqui viven los planes de continuidad/DRP/respaldos y runbooks que consulta el rol Soporte.
// Habla con conocimiento-service a traves del proxy: /api/proxy/conocimiento -> API_URL/api/v1/conocimiento

export type CategoriaArticulo =
    | "CONTINUIDAD"
    | "DRP"
    | "RESPALDOS"
    | "EVENTOS"
    | "INCIDENCIAS"
    | "RUNBOOK";

export const categoriaArticuloMeta: Record<CategoriaArticulo, { label: string; cls: string }> = {
    CONTINUIDAD: { label: "Continuidad del servicio", cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
    DRP: { label: "Recuperación ante desastres", cls: "bg-red-500/15 text-red-500 border-red-500/30" },
    RESPALDOS: { label: "Respaldos", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    EVENTOS: { label: "Monitoreo y eventos", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
    INCIDENCIAS: { label: "Gestión de incidencias", cls: "bg-orange-500/15 text-orange-500 border-orange-500/30" },
    RUNBOOK: { label: "Runbooks / procedimientos", cls: "bg-purple-500/15 text-purple-500 border-purple-500/30" },
};

export interface ArticuloResumen {
    id: number;
    codigo: string;
    titulo: string;
    resumen: string | null;
    categoria: CategoriaArticulo;
    categoriaLabel: string;
    etiquetas: string | null;
    autor: string | null;
    vistas: number;
    updatedAt: string;
}

export interface Articulo extends ArticuloResumen {
    contenido: string;
    createdAt: string;
}

export interface GuardarArticuloPayload {
    titulo: string;
    resumen?: string;
    categoria: CategoriaArticulo;
    contenido: string;
    etiquetas?: string;
    autorNombre?: string;
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

export async function getArticulos(filtros?: {
    categoria?: CategoriaArticulo;
    q?: string;
}): Promise<ArticuloResumen[]> {
    const params = new URLSearchParams();
    if (filtros?.categoria) params.set("categoria", filtros.categoria);
    if (filtros?.q) params.set("q", filtros.q);
    const qs = params.toString();
    const res = await fetch(`/api/proxy/conocimiento${qs ? `?${qs}` : ""}`);
    return parseOrThrow<ArticuloResumen[]>(res);
}

/** Abre el articulo completo (el backend incrementa el contador de vistas). */
export async function abrirArticulo(id: number): Promise<Articulo> {
    const res = await fetch(`/api/proxy/conocimiento/${id}`);
    return parseOrThrow<Articulo>(res);
}

export async function crearArticulo(
    autorId: string,
    payload: GuardarArticuloPayload
): Promise<Articulo> {
    const res = await fetch("/api/proxy/conocimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": autorId },
        body: JSON.stringify(payload),
    });
    return parseOrThrow<Articulo>(res);
}

export async function actualizarArticulo(
    id: number,
    payload: GuardarArticuloPayload
): Promise<Articulo> {
    const res = await fetch(`/api/proxy/conocimiento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return parseOrThrow<Articulo>(res);
}
