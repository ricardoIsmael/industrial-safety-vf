"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, BookOpen, Award, AlertTriangle, ArrowRight, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface EnrolledCourse {
  courseId: string;
  courseName: string;
  orderNumber: string;
  paidAt: string | null;
}

interface CourseDetail {
  id?: string;
  _id?: string;
  title: string;
  subtitle: string;
  coverImageUrl: string | null;
  details: { level: string; totalDurationHorus: number } | null;
  teacher: { name: string; profession: string } | null;
}

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const [lastCourse, setLastCourse] = useState<{ enrollment: EnrolledCourse; detail: CourseDetail } | null>(null);
  const [lastProgress, setLastProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [studyHours, setStudyHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.keycloakId) return;
    fetchLastCourse(session.keycloakId as string);
  }, [session?.keycloakId]);

  const parseDurationToHours = (duration: string): number => {
    if (!duration) return 0;
    const parts = duration.split(":").map(Number);
    if (parts.length === 3) return parts[0] + parts[1] / 60 + parts[2] / 3600;
    if (parts.length === 2) return parts[0] / 60 + parts[1] / 3600;
    return 0;
  };

  const fetchLastCourse = async (userId: string) => {
    try {
      const res = await fetch(`/api/proxy/orders/by-user/${userId}`);
      if (!res.ok) return;
      const orders: any[] = await res.json();

      // Solo órdenes COMPLETADAS (pago confirmado)
      const paid = orders.filter(o => o.orderStatus === "COMPLETED" && o.orderLineItemsList?.length > 0);
      if (paid.length === 0) return;

      const uniqueCourseIds = Array.from(new Set(
        paid.flatMap((o: any) => (o.orderLineItemsList ?? []).map((i: any) => i.idCurso))
      )) as string[];
      setCompletedCount(uniqueCourseIds.length);

      // 1 request bulk para todos los cursos; fallback a fetch individual si el endpoint no está activo
      let courseDetails: any[] = [];
      const bulkRes = await fetch(`/api/proxy/course/bulk?ids=${uniqueCourseIds.join(",")}`);
      if (bulkRes.ok) courseDetails = await bulkRes.json();

      // Horas de estudio acumuladas por lecciones completadas
      let totalHours = 0;
      for (const detail of courseDetails) {
        if (!detail) continue;
        const cid = detail._id ?? detail.id;
        const done = new Set<string>(JSON.parse(localStorage.getItem(`completed_${userId}_${cid}`) ?? "[]"));
        for (const lec of (detail.sectionList ?? []).flatMap((s: any) => s.lectureList ?? [])) {
          if (lec.lectureType !== "EXAM" && done.has(lec.id))
            totalHours += parseDurationToHours(lec.duration ?? "");
        }
      }
      setStudyHours(Math.round(totalHours * 10) / 10);

      // Último curso comprado (paidAt desc)
      paid.sort((a, b) => new Date(b.paidAt ?? b.createdAt ?? 0).getTime() - new Date(a.paidAt ?? a.createdAt ?? 0).getTime());
      const latestOrder = paid[0];
      const latestItem = latestOrder.orderLineItemsList[0];

      const enrollment: EnrolledCourse = {
        courseId: latestItem.idCurso,
        courseName: latestItem.courseName,
        orderNumber: latestOrder.orderNumber,
        paidAt: latestOrder.paidAt,
      };

      // Busca detalle en bulk; si no llegó, fetch individual como fallback
      let latestDetail = courseDetails.find((d: any) => d && (d._id ?? d.id) === latestItem.idCurso);
      if (!latestDetail) {
        const r = await fetch(`/api/proxy/course/${latestItem.idCurso}`);
        if (r.ok) latestDetail = await r.json();
      }
      if (!latestDetail) return;

      const courseId = latestDetail._id ?? latestDetail.id ?? latestItem.idCurso;
      const progress = parseInt(localStorage.getItem(`progress_${userId}_${courseId}`) ?? "0", 10);
      setLastProgress(progress);
      setLastCourse({ enrollment, detail: latestDetail });
    } catch (e) {
      console.error("Error cargando último curso:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          ¡Hola, {(session?.user?.name ?? "Estudiante").split(" ")[0]}!
        </h1>
        <p className="text-muted">Aquí tienes un resumen de tu progreso y capacitaciones pendientes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">

        {/* Columna principal */}
        <div className="md:col-span-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" /> Continuar Aprendiendo
            </h2>

            {loading ? (
              <div className="h-40 rounded-xl border border-border bg-surface/40 animate-pulse" />
            ) : lastCourse ? (
              <Card className="bg-surface/60 border-border overflow-hidden hover:border-primary/50 transition-colors group">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-2/5 p-4 relative">
                    <div className="aspect-video relative rounded-md overflow-hidden bg-slate-800 group-hover:scale-[1.02] transition-transform">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
                      {lastCourse.detail.coverImageUrl ? (
                        <img
                          src={lastCourse.detail.coverImageUrl}
                          alt={lastCourse.detail.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-80">
                          <ImageIcon className="h-12 w-12 text-slate-600" />
                        </div>
                      )}
                      {lastCourse.detail.details?.level && (
                        <div className="absolute bottom-2 right-2 z-20">
                          <Badge className="bg-black/60 text-white border-none pointer-events-none backdrop-blur-sm">
                            {lastCourse.detail.details.level}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:w-3/5 p-6 flex flex-col justify-center">
                    {lastCourse.detail.details?.level && (
                      <Badge variant="outline" className="w-fit mb-2 border-primary text-primary">
                        {lastCourse.detail.details.level}
                      </Badge>
                    )}
                    <h3 className="text-xl font-bold mb-2">{lastCourse.detail.title}</h3>
                    {lastCourse.detail.subtitle && (
                      <p className="text-sm text-muted mb-4 line-clamp-2">{lastCourse.detail.subtitle}</p>
                    )}

                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-xs text-muted font-medium">
                        <span>Progreso del Curso</span>
                        <span className="text-primary">{lastProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${lastProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link href={`/student/learning/${lastCourse.detail._id ?? lastCourse.detail.id ?? lastCourse.enrollment.courseId}`}>
                        <Button className="w-full sm:w-auto shadow-lg shadow-primary/20">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {lastProgress > 0 ? "Reanudar Lección" : "Empezar Curso"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="bg-surface/40 border-border p-8 text-center">
                <p className="text-muted mb-4">Aún no tienes cursos inscritos.</p>
                <Link href="/cursos">
                  <Button variant="outline">Explorar catálogo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </Card>
            )}
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-surface/40 border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted">Horas de Estudio</p>
                    <p className="text-3xl font-bold">{studyHours}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-surface/40 border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted">Cursos Adquiridos</p>
                    <p className="text-3xl font-bold">{completedCount}</p>
                  </div>
                  <div className="p-2 bg-success/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-surface/40 border-border">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted">Exámenes Aprobados</p>
                    <p className="text-3xl font-bold text-foreground">3</p>
                  </div>
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Award className="w-5 h-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar alertas */}
        <div className="md:col-span-4 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" /> Tareas Pendientes
          </h2>

          <div className="flex flex-col gap-4">
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-warning mt-1.5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-warning tracking-wide">PRÓXIMO A VENCER</h4>
                    <p className="text-sm mt-1 mb-2">Tu certificación en <strong>Primeros Auxilios</strong> caduca en 5 días.</p>
                    <Link href="/student/learning" className="text-xs font-medium text-warning hover:underline flex items-center gap-1">
                      Realizar recertificación <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-danger/5 border-danger/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-danger" />
              <CardContent className="p-5 pl-6">
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-danger" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-danger tracking-wide">REQUERIDO URGENTE</h4>
                    <p className="text-sm mt-1 mb-3">Nuevo módulo obligatorio asignado por RRHH: <strong>Protocolo de Evacuación Sísmica</strong>.</p>
                    <Button variant="danger" size="sm" className="w-full text-xs h-8">
                      Iniciar Módulo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface/40 border-border">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground tracking-wide">NUEVA ASIGNACIÓN</h4>
                    <p className="text-sm text-muted mt-1">Curso "Manejo de Extintores Nivel 2". Tienes 14 días para completarlo.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
