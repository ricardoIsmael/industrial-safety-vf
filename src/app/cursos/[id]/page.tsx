import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingNav from "@/components/layout/landing-nav";
import { CourseReviews } from "@/components/courses/course-reviews";
import { AddToCartButton } from "@/components/courses/add-to-cart-button";
import {
  Star,
  Clock,
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Globe,
  MonitorPlay,
  FileText,
  Award,
  ChevronRight,
  UserCheck,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { CoursePreviewModal } from "@/components/courses/course-preview-modal";
import { auth } from "@/auth";

interface LectureFromAPI {
  title: string;
  duration?: number;
  lectureType?: string;
  contentUrl?: string;
  isPreview?: boolean;
}

interface SectionFromAPI {
  title: string;
  lectureList?: LectureFromAPI[];
}

interface CourseDetailFromAPI {
  id?: string;
  _id?: string;
  title: string;
  subtitle: string;
  coverImageUrl?: string;
  teacher: { id: string; name: string; profession: string };
  details: {
    language: string;
    level: string;
    totalDurationHorus: number;
    totalLecture: number;
    precio: number;
    lastUpdated: string;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  sectionList?: SectionFromAPI[];
  requirements?: string[];
  learningOutcomes?: string[];
}

async function getCourse(id: string): Promise<CourseDetailFromAPI | null> {
  const url = `${process.env.API_URL}/api/v1/course/${id}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[/cursos/${id}] Backend ${res.status}:`, body);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[/cursos/${id}] Fetch failed for ${url}:`, err);
    return null;
  }
}

interface ReviewFromAPI {
  id: string;
  author: string;
  authorAvatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

async function getReviews(id: string): Promise<ReviewFromAPI[]> {
  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/course/${id}/reviews`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(`[/cursos/${id}/reviews] Fetch failed:`, err);
    return [];
  }
}

async function checkAlreadyOwned(courseId: string, keycloakId: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.API_URL}/api/v1/orders/by-user/${keycloakId}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    if (!res.ok) return false;
    const orders: any[] = await res.json();
    return orders.some(
      o => o.orderStatus === "COMPLETED" &&
        (o.orderLineItemsList ?? []).some((item: any) => item.idCurso === courseId)
    );
  } catch {
    return false;
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, session, reviews] = await Promise.all([getCourse(id), auth(), getReviews(id)]);

  if (!course) notFound();

  const courseId = course._id ?? course.id ?? id;

  const alreadyOwned = session?.keycloakId && session?.accessToken
    ? await checkAlreadyOwned(courseId, session.keycloakId as string, session.accessToken as string)
    : false;
  const price = course.details?.precio ? `$${course.details.precio.toFixed(2)}` : "$0.00";
  const rating = course.reviews?.averageRating ?? 0;
  const reviewCount = course.reviews?.totalReviews ?? 0;
  const duration = course.details?.totalDurationHorus ? `${course.details.totalDurationHorus} h` : "—";
  const totalLectures = course.details?.totalLecture ?? 0;
  const sections = course.sectionList ?? [];
  const outcomes = course.learningOutcomes ?? [];
  const requirements = course.requirements ?? [];
  const previewVideoUrl = sections
    .flatMap(s => s.lectureList ?? [])
    .find(l => l.contentUrl)?.contentUrl ?? null;

  const formatLectureDuration = (seconds?: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")} min` : `${s}s`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav />

      {/* HERO */}
      <section className="relative bg-slate-950 pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="mx-auto max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2">
            <nav className="flex items-center text-sm text-amber-400 font-medium mb-6">
              <Link href="/" className="hover:text-amber-300 transition-colors">Inicio</Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <Link href="/cursos" className="hover:text-amber-300 transition-colors">Cursos</Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-slate-400">{course.details?.level ?? "Curso"}</span>
            </nav>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {course.title}
            </h1>

            <p className="text-lg text-slate-300 mb-6 leading-relaxed">
              {course.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">{rating.toFixed(1)}</span>
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${star <= Math.floor(rating) ? "fill-current" : "text-slate-600"}`} />
                  ))}
                </div>
                <span className="text-slate-400 underline decoration-slate-600 hover:text-slate-300 cursor-pointer">
                  ({reviewCount.toLocaleString()} valoraciones)
                </span>
              </div>
              {totalLectures > 0 && (
                <div className="text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> {totalLectures} lecciones
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-8">
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
                Creado por {course.teacher?.name ?? "Instructor"}
              </Badge>
              {course.details?.lastUpdated && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Última actualización {course.details.lastUpdated}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> {course.details?.language ?? "Español"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

          <div className="lg:col-span-2 space-y-12">

            {/* Learning Outcomes */}
            {outcomes.length > 0 && (
              <div className="border border-slate-700/50 bg-surface-secondary/20 p-6 sm:p-8 rounded-xl">
                <h2 className="text-2xl font-bold text-foreground mb-6">Lo que aprenderás</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {outcomes.map((outcome, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm leading-relaxed">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Instructor</h2>
              <div className="flex flex-col gap-4">
                <span className="text-xl font-bold text-amber-400">{course.teacher?.name ?? "Instructor"}</span>
                <div className="text-slate-400">{course.teacher?.profession ?? ""}</div>
                <div className="flex items-center gap-6 mt-2 mb-4">
                  <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-slate-700 shrink-0 bg-slate-800 flex items-center justify-center">
                    <span className="text-4xl font-bold text-amber-400">
                      {(course.teacher?.name ?? "I").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-amber-500" /> {rating.toFixed(1)} Calificación del curso
                    </li>
                    <li className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-amber-500" /> {reviewCount.toLocaleString()} Reseñas
                    </li>
                    {totalLectures > 0 && (
                      <li className="flex items-center gap-3">
                        <PlayCircle className="h-4 w-4 text-amber-500" /> {totalLectures} Lecciones
                      </li>
                    )}
                    {sections.length > 0 && (
                      <li className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-amber-500" /> {sections.length} Módulos
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Requisitos</h2>
                <ul className="list-disc pl-5 text-slate-300 text-sm space-y-2 marker:text-slate-500">
                  {requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Descripción</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {course.subtitle}
              </p>
            </div>

            {/* Syllabus */}
            {sections.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Contenido del curso</h2>
                  <span className="text-sm text-slate-400">{sections.length} secciones • {duration} de duración total</span>
                </div>

                <div className="flex flex-col border border-slate-700/50 rounded-xl overflow-hidden bg-surface-secondary/10">
                  {sections.map((section, idx) => (
                    <details key={idx} className="group border-b border-slate-700/50 last:border-b-0">
                      <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer bg-surface/50 hover:bg-surface transition-colors list-none">
                        <div className="flex items-center gap-3">
                          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-300 group-open:-rotate-180" />
                          <span className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                            {section.title}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {section.lectureList?.length ?? 0} lecciones
                        </span>
                      </summary>
                      <div className="p-4 sm:px-12 sm:pb-5 bg-surface-secondary/5 text-sm text-slate-400">
                        {section.lectureList && section.lectureList.length > 0 ? (
                          <ul className="space-y-3">
                            {section.lectureList.map((lecture, lIdx) => (
                              <li key={lIdx} className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  {lecture.lectureType === "PDF" ? (
                                    <FileText className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                                  )}
                                  <span>{lecture.title}</span>
                                </div>
                                {lecture.duration ? (
                                  <span className="text-xs text-slate-500 shrink-0">
                                    {formatLectureDuration(lecture.duration)}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic text-xs">Sin lecciones aún.</p>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <CourseReviews
              courseRating={rating}
              courseReviewCount={reviewCount}
              reviews={reviews}
            />
          </div>

          {/* Sticky purchase card - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-28 -mt-[420px] w-full max-w-[380px] ml-auto bg-surface rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-30">
              <CoursePreviewModal
                videoUrl={previewVideoUrl}
                coverImageUrl={course.coverImageUrl}
                courseTitle={course.title}
              />
              <div className="p-6">
                {alreadyOwned ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-400 font-semibold text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      Ya tienes este curso
                    </div>
                    <Link href={`/student/learning/${courseId}`} className="block">
                      <Button className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20">
                        <PlayCircle className="mr-2 h-5 w-5" /> Ir a aprender
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-6">{price}</div>
                    <AddToCartButton
                      courseId={courseId}
                      title={course.title}
                      price={price}
                      image={course.coverImageUrl ?? ""}
                      instructorName={course.teacher?.name ?? "Instructor"}
                    />
                    <Button variant="outline" className="w-full mb-6 h-12 border-slate-600 hover:bg-slate-800">
                      Comprar ahora
                    </Button>
                    <div className="text-center text-xs text-muted mb-6">
                      Garantía de reembolso de 30 días
                    </div>
                    <h4 className="font-semibold text-foreground mb-3">Este curso incluye:</h4>
                    <ul className="space-y-3 text-sm text-slate-300 mb-6">
                      <li className="flex items-center gap-3">
                        <MonitorPlay className="h-4 w-4 text-slate-400" /> {duration} de video bajo demanda
                      </li>
                      {totalLectures > 0 && (
                        <li className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-slate-400" /> {totalLectures} lecciones
                        </li>
                      )}
                      <li className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-slate-400" /> Acceso en dispositivos móviles y TV
                      </li>
                      <li className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-slate-400" /> Certificado de finalización
                      </li>
                    </ul>
                    <div className="border-t border-slate-700 pt-4">
                      <Link href="#" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors underline underline-offset-4 decoration-slate-600">
                        Aplicar cupón
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Purchase card - Mobile */}
          <div className="block lg:hidden mt-8">
            <div className="w-full bg-surface rounded-xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="p-6">
                {alreadyOwned ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-400 font-semibold text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      Ya tienes este curso
                    </div>
                    <Link href={`/student/learning/${courseId}`} className="block">
                      <Button className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20">
                        <PlayCircle className="mr-2 h-5 w-5" /> Ir a aprender
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-6">{price}</div>
                    <AddToCartButton
                      courseId={courseId}
                      title={course.title}
                      price={price}
                      image={course.coverImageUrl ?? ""}
                      instructorName={course.teacher?.name ?? "Instructor"}
                    />
                    <Button variant="outline" className="w-full mb-6 h-12 border-slate-600 hover:bg-slate-800">
                      Comprar ahora
                    </Button>
                    <div className="text-center text-xs text-muted mb-6">
                      Garantía de reembolso de 30 días
                    </div>
                    <div className="border-t border-slate-700 pt-4 text-center">
                      <Link href="#" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors underline underline-offset-4 decoration-slate-600">
                        Aplicar cupón
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      <footer className="border-t border-slate-800 bg-surface px-6 py-10 mt-auto">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted">
          &copy; 2026 PrevenciónTech. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
