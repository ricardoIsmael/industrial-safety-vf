"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Activity, Video, GraduationCap, ShieldAlert, Shield, Database, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ReportarIncidenteButton } from "@/components/incidencias/reportar-incidente-button"

interface UserRow { role?: string }

const ROLE_LABELS: Record<string, string> = {
  ALUMNO: "Estudiantes",
  TRABAJADOR: "Trabajadores",
  JEFE_SEGURIDAD: "Jefes de Seguridad",
  GERENCIA_GENERAL: "Gerencia",
  MARKETING: "Marketing",
  INSTRUCTOR: "Instructores",
  ADMINISTRADOR: "Administradores",
  LOGISTICA_ALMACEN: "Logística",
}

function normalizeRole(role?: string | null): string {
  if (!role) return "OTRO"
  const r = role.trim().toUpperCase()
  return r.startsWith("ROLE_") ? r.slice(5) : r
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRow[]>([])
  const [coursesCount, setCoursesCount] = useState<number | null>(null)
  const [incidentsCount, setIncidentsCount] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/proxy/users").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/proxy/course").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/proxy/incidents?size=1").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([u, c, inc]) => {
        setUsers(Array.isArray(u) ? u : [])
        setCoursesCount(Array.isArray(c) ? c.length : 0)
        setIncidentsCount(inc?.totalElements ?? inc?.content?.length ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const byRole = users.reduce<Record<string, number>>((acc, u) => {
    const r = normalizeRole(u.role)
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(byRole)
    .map(([role, count]) => ({ role: ROLE_LABELS[role] ?? role, count }))
    .sort((a, b) => b.count - a.count)

  const staffRoles = ["JEFE_SEGURIDAD", "GERENCIA_GENERAL", "MARKETING", "INSTRUCTOR", "ADMINISTRADOR", "LOGISTICA_ALMACEN"]
  const staff = staffRoles.reduce((s, r) => s + (byRole[r] ?? 0), 0)
  const workers = byRole["TRABAJADOR"] ?? 0
  const students = byRole["ALUMNO"] ?? 0

  const kpis = [
    {
      title: "Usuarios Totales",
      value: loading ? null : users.length,
      icon: Users,
      sub: `Staff: ${staff} · Trabajadores: ${workers} · Alumnos: ${students}`,
    },
    {
      title: "Cursos en Plataforma",
      value: loading ? null : coursesCount ?? 0,
      icon: GraduationCap,
      sub: "Disponibles para asignar o vender",
    },
    {
      title: "Incidentes Registrados",
      value: loading ? null : incidentsCount ?? 0,
      icon: ShieldAlert,
      sub: "Detecciones de seguridad totales",
    },
    {
      title: "Cámaras Activas",
      value: "1 / 1",
      icon: Video,
      sub: "Operativas (detección IA)",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Visión General del Sistema</h1>
          <p className="text-muted">Métricas reales de la plataforma a partir de los microservicios.</p>
        </div>
        <ReportarIncidenteButton role="ADMINISTRADOR" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="bg-surface/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {kpi.value === null ? (
                <Loader2 className="h-7 w-7 animate-spin text-muted" />
              ) : (
                <div className="text-2xl font-bold">{kpi.value}</div>
              )}
              <p className="text-xs text-muted mt-2">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribución real de usuarios por rol */}
      <Card className="bg-surface/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Distribución de Usuarios por Rol
          </CardTitle>
          <CardDescription>Conteo real de cuentas registradas en user-service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-muted">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-muted text-sm">
                Sin usuarios registrados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="role" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "8px" }}
                    itemStyle={{ color: "var(--color-foreground)" }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accesos a módulos */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Módulos del Sistema</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            { name: "Jefe de Seguridad", href: "/jefe", icon: Shield, color: "text-amber-500", desc: "Monitoreo IA y EPP" },
            { name: "Gerencia General", href: "/gerencia", icon: Activity, color: "text-emerald-500", desc: "Reportes y KPIs" },
            { name: "Logística / Almacén", href: "/logistica", icon: Database, color: "text-blue-500", desc: "Control de Inventario" },
            { name: "Marketing", href: "/marketing", icon: Users, color: "text-pink-500", desc: "Campañas y Ventas" },
            { name: "Instructor de Cursos", href: "/instructor", icon: GraduationCap, color: "text-purple-500", desc: "Gestión Académica" },
            { name: "Operario / Trabajador", href: "/trabajador", icon: Activity, color: "text-orange-500", desc: "Portal de Campo" },
            { name: "Portal Estudiante", href: "/student", icon: GraduationCap, color: "text-indigo-500", desc: "Cursos y Pagos" },
          ].map((module) => (
            <Link key={module.name} href={module.href}>
              <Card className="bg-surface/40 hover:bg-surface/60 border-border transition-all hover:scale-[1.02] cursor-pointer group h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl bg-slate-900 group-hover:bg-slate-800 transition-colors", module.color)}>
                      <module.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{module.name}</h3>
                      <p className="text-xs text-muted leading-tight mt-1">{module.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
