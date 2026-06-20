"use client";
import { useState, use, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PlayCircle, CheckCircle2, Loader2, ClipboardList, Award } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { CourseData, Lecture } from "@/types/course";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { PlayerHeader } from "@/components/courses/player-header";
import { CourseSidebar } from "@/components/courses/course-sidebar";
import { CourseForum } from "@/components/courses/course-forum";
import { ExamModal } from "@/components/courses/exam-modal";

export default function CoursePlayerPage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = use(params);
  const { data: session } = useSession();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"desc" | "forum">("desc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [hasExam, setHasExam] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  const uid = (session as any)?.keycloakId ?? "guest";
  const { completedIds, loadProgress, markCompleted } = useCourseProgress(uid, cursoId);

  const totalLectures = course?.sectionList
    .flatMap(s => s.lectureList)
    .filter(l => l.lectureType !== "EXAM").length ?? 0;
  const progressPct = totalLectures > 0 ? Math.round((completedIds.size / totalLectures) * 100) : 0;

  useEffect(() => {
    if (!uid || uid === "guest") return;
    fetchCourse();
    loadProgress();
    fetch(`/api/proxy/exams/exists/${cursoId}`)
      .then(r => r.ok ? r.json() : { exists: false })
      .then(({ exists }) => setHasExam(exists))
      .catch(() => {});
  }, [cursoId, uid]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/proxy/course/${cursoId}`);
      if (!res.ok) return;
      const data: CourseData = await res.json();
      setCourse(data);
      const saved = JSON.parse(localStorage.getItem(`completed_${uid}_${cursoId}`) ?? "[]") as string[];
      const savedSet = new Set(saved);
      for (const sec of data.sectionList ?? []) {
        for (const lec of sec.lectureList ?? []) {
          if (lec.lectureType !== "EXAM" && !savedSet.has(lec.id)) {
            setActiveLecture(lec);
            return;
          }
        }
      }
      const first = data.sectionList?.[0]?.lectureList?.[0];
      if (first) setActiveLecture(first);
    } catch (e) {
      console.error("Error cargando curso:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted">
        <p>No se pudo cargar el curso.</p>
        <Link href="/student/learning">
          <Button variant="outline" className="mt-4">Volver</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 lg:-m-8">
      <PlayerHeader
        course={course}
        progressPct={progressPct}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Área de contenido principal */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-background">

          {/* Video / portada */}
          <div className="bg-black w-full aspect-video md:aspect-auto md:h-[60vh] flex items-center justify-center shrink-0 border-b border-border relative group">
            {activeLecture?.contentUrl ? (
              <video
                key={activeLecture.id}
                src={activeLecture.contentUrl}
                controls
                className="w-full h-full object-contain"
                onEnded={() => markCompleted(activeLecture.id, course)}
              />
            ) : course.coverImageUrl ? (
              <>
                <Image
                  src={course.coverImageUrl}
                  alt={course.title}
                  fill
                  className="object-cover opacity-60"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    className="h-16 w-16 bg-primary/90 hover:bg-primary text-black rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xl shadow-primary/20"
                    onClick={() => activeLecture && markCompleted(activeLecture.id, course)}
                  >
                    <PlayCircle className="h-8 w-8 ml-1" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <PlayCircle className="h-16 w-16" />
                <p className="text-sm">Selecciona una lección del menú lateral</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex-1 flex flex-col">
            <div className="flex border-b border-border px-6">
              {(["desc", "forum"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {t === "desc" ? "Descripción" : "Foro de Dudas"}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              {activeTab === "desc" && (
                <div className="animate-in fade-in duration-300 max-w-3xl">
                  <h3 className="text-xl font-bold mb-3">{activeLecture?.title ?? course.title}</h3>
                  {course.subtitle && (
                    <p className="text-muted leading-relaxed mb-6">{course.subtitle}</p>
                  )}
                  {course.details && (
                    <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted">
                      {course.details.level && (
                        <span>Nivel: <strong className="text-foreground">{course.details.level}</strong></span>
                      )}
                      {course.details.totalDurationHorus > 0 && (
                        <span>Duración: <strong className="text-foreground">{course.details.totalDurationHorus}h</strong></span>
                      )}
                      {course.details.totalLecture > 0 && (
                        <span>Lecciones: <strong className="text-foreground">{course.details.totalLecture}</strong></span>
                      )}
                    </div>
                  )}
                  {course.teacher && (
                    <div className="flex items-center gap-4 bg-surface-secondary/50 p-4 rounded-xl border border-border">
                      <Avatar src={undefined} fallback={course.teacher.name[0]} />
                      <div>
                        <p className="text-sm text-muted">Instructor</p>
                        <p className="text-base font-bold text-foreground">{course.teacher.name}</p>
                        {course.teacher.profession && (
                          <p className="text-xs text-muted">{course.teacher.profession}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {activeLecture && !completedIds.has(activeLecture.id) && activeLecture.lectureType !== "EXAM" && (
                    <Button
                      className="mt-6 gap-2"
                      onClick={() => markCompleted(activeLecture.id, course)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Marcar como completada
                    </Button>
                  )}
                  {hasExam && (
                    <div className={`mt-8 rounded-2xl border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                      progressPct === 100 ? "bg-warning/10 border-warning/40" : "bg-surface-secondary/30 border-border/40"
                    }`}>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                        progressPct === 100 ? "bg-warning/20" : "bg-surface-secondary"
                      }`}>
                        <ClipboardList className={`h-6 w-6 ${progressPct === 100 ? "text-warning" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">Examen Final del Curso</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {progressPct === 100
                            ? "¡Completaste todas las lecciones! Ya puedes rendir el examen final."
                            : `Completa todas las lecciones para desbloquear el examen final (${progressPct}% completado).`}
                        </p>
                      </div>
                      <Button
                        onClick={() => setExamOpen(true)}
                        disabled={progressPct < 100}
                        className={`shrink-0 gap-2 font-bold ${
                          progressPct === 100 ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""
                        }`}
                      >
                        <Award className="h-4 w-4" />
                        {progressPct === 100 ? "Rendir Examen" : "Bloqueado"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "forum" && <CourseForum cursoId={cursoId} />}
            </div>
          </div>
        </div>

        <CourseSidebar
          course={course}
          completedIds={completedIds}
          activeLecture={activeLecture}
          onSelectLecture={lec => { setActiveLecture(lec); setSidebarOpen(false); }}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          hasExam={hasExam}
          progressPct={progressPct}
          onOpenExam={() => setExamOpen(true)}
        />
      </div>

      <ExamModal
        open={examOpen}
        onOpenChange={setExamOpen}
        cursoId={cursoId}
        courseTitle={course.title}
      />
    </div>
  );
}
