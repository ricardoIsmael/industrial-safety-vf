import type { Categoria } from "@/services/incidenciaService";

export interface TipoIncidencia {
    tipo: string;
    categoria: Categoria;
}

// Normaliza "ROLE_TRABAJADOR" / "trabajador" -> "TRABAJADOR"
export function normalizeRole(role?: string | null): string {
    if (!role) return "";
    const r = role.trim().toUpperCase();
    return r.startsWith("ROLE_") ? r.slice(5) : r;
}

const GENERICO: TipoIncidencia[] = [
    { tipo: "La aplicación va muy lenta", categoria: "REDES_COMUNICACIONES" },
    { tipo: "No puedo iniciar sesión", categoria: "SEGURIDAD" },
    { tipo: "Otro", categoria: "OTROS" },
];

// Catálogo de tipos de incidencia por rol (cada rol reporta lo de su área).
const CATALOGO: Record<string, TipoIncidencia[]> = {
    ALUMNO: [
        { tipo: "El curso no carga", categoria: "APLICACIONES" },
        { tipo: "El video no reproduce", categoria: "APLICACIONES" },
        { tipo: "Error en el foro del curso", categoria: "APLICACIONES" },
        { tipo: "Problema con el pago del curso", categoria: "APLICACIONES" },
        { tipo: "Otro", categoria: "OTROS" },
    ],
    INSTRUCTOR: [
        { tipo: "No puedo subir el video del curso", categoria: "APLICACIONES" },
        { tipo: "No puedo crear/editar un curso", categoria: "APLICACIONES" },
        { tipo: "Error en el foro", categoria: "APLICACIONES" },
        { tipo: "Otro", categoria: "OTROS" },
    ],
    TRABAJADOR: [
        { tipo: "No veo mis alertas/infracciones", categoria: "APLICACIONES" },
        { tipo: "No puedo apelar una infracción", categoria: "APLICACIONES" },
        { tipo: "La aplicación va muy lenta", categoria: "REDES_COMUNICACIONES" },
        { tipo: "No puedo iniciar sesión", categoria: "SEGURIDAD" },
        { tipo: "Otro", categoria: "OTROS" },
    ],
    JEFE_SEGURIDAD: [
        { tipo: "No cargan los reportes de detección", categoria: "BASE_DATOS" },
        { tipo: "Reporte con datos incorrectos", categoria: "BASE_DATOS" },
        { tipo: "No puedo revisar apelaciones", categoria: "APLICACIONES" },
        { tipo: "Otro", categoria: "OTROS" },
    ],
    MARKETING: [
        { tipo: "No puedo crear solicitud de cambio de precio", categoria: "APLICACIONES" },
        { tipo: "No puedo crear cupones de descuento", categoria: "APLICACIONES" },
        { tipo: "Otro", categoria: "OTROS" },
    ],
    LOGISTICA_ALMACEN: [
        { tipo: "No puedo crear solicitud de compra/EPP", categoria: "APLICACIONES" },
        { tipo: "Reporte de inventario con error", categoria: "BASE_DATOS" },
        { tipo: "Otro", categoria: "OTROS" },
    ],
    GERENCIA_GENERAL: [
        { tipo: "Reporte ejecutivo con datos incorrectos", categoria: "BASE_DATOS" },
        { tipo: "No puedo aprobar solicitudes", categoria: "APLICACIONES" },
        { tipo: "Otro", categoria: "OTROS" },
    ],
};

export function tiposParaRol(role?: string | null): TipoIncidencia[] {
    return CATALOGO[normalizeRole(role)] ?? GENERICO;
}
