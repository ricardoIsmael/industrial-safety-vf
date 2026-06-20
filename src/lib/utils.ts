import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_MAP: Record<string, string> = {
  ROLE_JEFE_SEGURIDAD:   "Jefe de Seguridad",
  ROLE_GERENCIA_GENERAL: "Gerente General",
  ROLE_TRABAJADOR:       "Operario / Empleado",
  ROLE_ALUMNO:           "Estudiante",
  ROLE_INSTRUCTOR:       "Instructor",
  ROLE_MARKETING:        "Marketing",
  ROLE_LOGISTICA_ALMACEN:"Logística",
  ROLE_ADMINISTRADOR:    "Administrador",
};

export function getRoleDisplayName(roles: string[] = []): string {
  for (const role of roles) {
    const display = ROLE_MAP[role];
    if (display) return display;
  }
  return "";
}
