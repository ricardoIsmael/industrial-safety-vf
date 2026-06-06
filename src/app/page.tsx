import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingNav from "@/components/layout/landing-nav";
import { PersonalizedHero } from "@/components/layout/personalized-hero";

const CameraMockup = dynamic(() => import("@/components/layout/camera-mockup"), {
  loading: () => <div className="aspect-video w-full rounded-xl bg-surface animate-pulse" />,
});
const SafetyCycle = dynamic(() => import("@/components/layout/safety-cycle"));
import {
  ShieldCheck,
  Award,
  Leaf,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  BellRing,
  TrendingDown,
  FileText,
  LayoutDashboard,
  Shield,
  Clock,
  GraduationCap,
  UserCheck,
  FileSignature,
  Star,
  PlayCircle,
} from "lucide-react";

const certifications = [
  {
    iso: "ISO 45001",
    title: "Seguridad y Salud en el Trabajo",
    description:
      "Sistema de Gestión de Seguridad y Salud en el Trabajo. Garantiza la prevención de lesiones, la reducción de riesgos laborales y el cumplimiento legal en materia de SST.",
    icon: ShieldCheck,
  },
  {
    iso: "ISO 9001",
    title: "Gestión de la Calidad",
    description:
      "Estándar internacional para sistemas de gestión de calidad. Asegura la mejora continua, la satisfacción del cliente y la estandarización de procesos operativos.",
    icon: Award,
  },
  {
    iso: "ISO 14001",
    title: "Gestión Ambiental",
    description:
      "Marco para la gestión responsable del impacto ambiental. Minimiza la huella ecológica de las operaciones industriales y asegura el cumplimiento regulatorio ambiental.",
    icon: Leaf,
  },
];

const courses = [
  {
    id: "prevencion-riesgos",
    title: "Prevención de Riesgos Laborales",
    description: "Curso fundamental sobre normativas de seguridad, identificación de peligros, y control de riesgos en la industria.",
    duration: "40 horas",
    level: "Básico",
    category: "Normativas",
    rating: 4.8,
    reviews: 1240,
    instructor: {
      name: "Ing. Carlos Mendoza",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      role: "Especialista en SST",
    },
    icon: ShieldCheck,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "uso-correcto-epp",
    title: "Uso Correcto de EPP",
    description: "Capacitación práctica en la selección, uso, mantenimiento y disposición final del Equipo de Protección Personal.",
    duration: "20 horas",
    level: "Intermedio",
    category: "Equipos",
    rating: 4.9,
    reviews: 856,
    instructor: {
      name: "Lic. Ana Torres",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      role: "Auditora HSEQ",
    },
    icon: UserCheck,
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "auditor-interno-45001",
    title: "Auditor Interno ISO 45001",
    description: "Formación especializada para preparar y ejecutar auditorías internas en sistemas de gestión de seguridad y salud en el trabajo.",
    duration: "60 horas",
    level: "Avanzado",
    category: "Auditoría",
    rating: 4.7,
    reviews: 512,
    instructor: {
      name: "Dr. Roberto Silva",
      avatar: "https://randomuser.me/api/portraits/men/67.jpg",
      role: "Lead Auditor ISO 45001",
    },
    icon: FileSignature,
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=800&auto=format&fit=crop",
  },
];

const keyCapabilities = [
  { icon: BellRing, text: "Alertas de IA en tiempo real." },
  { icon: TrendingDown, text: "Reducción de tasa de incidentes." },
  { icon: FileText, text: "Digitalización de reportes." },
  { icon: LayoutDashboard, text: "Panel de control gerencial." },
];

export default async function LandingPage() {
  const session = await auth();

  // Redirección automática para administradores
  const roles = session?.roles ?? [];
  if (roles.includes("ROLE_ADMINISTRADOR") || roles.includes("ADMINISTRADOR")) {
    redirect("/select-role");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav session={session} />

      {/* ======================== HERO SECTION ======================== */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute -top-20 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/4 h-[300px] w-[300px] rounded-full bg-gradient-to-r from-success/5 to-primary/5 blur-[80px] animate-pulse delay-1000" />

        <PersonalizedHero session={session} />

        {/* Trust indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Certificado ISO 45001</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span>Certificado ISO 9001</span>
          </div>
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-success" />
            <span>Certificado ISO 14001</span>
          </div>
        </div>
      </section>

      {/* ======================== CAMERA MOCKUP ======================== */}
      <section id="demo" className="relative z-10 px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">
              Demostración en Vivo
            </Badge>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Detección de EPP por Visión Artificial
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Cada cámara analiza en tiempo real el cumplimiento del equipo de protección personal.
              Las cajas delimitadoras verdes indican detección exitosa con alta confianza.
            </p>
          </div>
          <CameraMockup />
        </div>
      </section>

      {/* ======================== VALUE PROPOSITION ======================== */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left column — Descriptive text (8 cols) */}
            <div className="lg:col-span-8">
              {/* Block 1 */}
              <div className="border-b border-slate-800 pb-8 mb-8">
                <h2 className="mb-4 text-2xl font-semibold leading-tight text-foreground md:text-3xl">
                  Prevención Activa impulsada por Inteligencia Artificial
                </h2>
                <p className="text-base leading-relaxed text-muted">
                  Nuestra plataforma transforma la seguridad industrial de un proceso reactivo a
                  uno proactivo. Mediante el análisis de video en tiempo real, detectamos la
                  ausencia de Equipos de Protección Personal (EPP) y emitimos alertas antes de
                  que ocurra un incidente.
                </p>
              </div>

              {/* Block 2 */}
              <div>
                <h2 className="mb-4 text-2xl font-semibold leading-tight text-foreground md:text-3xl">
                  Trazabilidad Total y Cero Papel
                </h2>
                <p className="text-base leading-relaxed text-muted">
                  Digitaliza los reportes de inspección y elimina los registros manuales en
                  papel, reduciendo errores y garantizando que toda tu operación cumpla con las
                  normativas internacionales al instante.
                </p>
              </div>
            </div>

            {/* Right column — Capabilities card (4 cols) */}
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-slate-800 bg-surface p-8">
                <h3 className="mb-6 text-xl font-bold text-foreground">Capacidades Clave</h3>

                <ul className="flex flex-col">
                  {keyCapabilities.map((cap, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-4 py-4 ${i < keyCapabilities.length - 1 ? "border-b border-slate-800" : ""
                        }`}
                    >
                      <cap.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm text-slate-300">{cap.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link
                    href="/login"
                    className="flex h-12 w-full items-center justify-center rounded-lg bg-amber-500 px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-600"
                  >
                    SOLICITAR DEMOSTRACIÓN
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== SAFETY CYCLE ======================== */}
      <SafetyCycle />

      {/* ======================== COURSES ======================== */}
      <section id="cursos" className="relative z-10 px-4 sm:px-6 py-16 md:py-24 bg-surface-secondary/30">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <Badge variant="secondary" className="mb-3">
              Capacitación Continua
            </Badge>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl text-balance">
              Cursos de Seguridad Industrial
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted text-sm md:text-base text-balance">
              Capacita a tu personal con nuestros cursos especializados. Cumple con las normativas y fomenta una cultura de prevención de riesgos en tu empresa.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <Link
                href={`/cursos/${course.id}`}
                key={index}
                className="block group animate-in fade-in slide-in-from-bottom-4 duration-500 [animation-fill-mode:both]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Card
                  className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800/50 bg-surface transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  {/* Main Course Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent"></div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-slate-950/60 backdrop-blur-md text-amber-400 border border-amber-500/30">
                        {course.category}
                      </Badge>
                    </div>

                    {/* Play Button Overlay on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 transform scale-75 transition-transform duration-300 group-hover:scale-100">
                        <PlayCircle className="h-7 w-7" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="relative p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-amber-400 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    
                    {/* Instructor Info */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-700">
                        <Image
                          src={course.instructor.avatar}
                          alt={course.instructor.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{course.instructor.name}</span>
                    </div>

                    {/* Rating */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-400">{course.rating}</span>
                      <div role="img" aria-label={`Calificación: ${course.rating} de 5`} className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} aria-hidden="true" className={`h-4 w-4 ${star <= Math.floor(course.rating) ? 'fill-current' : 'text-slate-600'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">({course.reviews})</span>
                    </div>

                    <p className="mt-4 mb-6 flex-grow text-sm text-muted line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <GraduationCap className="h-4 w-4" />
                        <span>{course.level}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/cursos">
              <Button variant="secondary" className="border-slate-700 text-foreground hover:bg-slate-800">
                Ver Catálogo Completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================== CERTIFICATIONS ======================== */}
      <section id="certifications" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <Badge variant="secondary" className="mb-3">
              Respaldo Internacional
            </Badge>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Estándares y Certificaciones Internacionales
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Nuestra plataforma cumple con los estándares más exigentes de la industria,
              asegurando calidad, seguridad y responsabilidad ambiental en cada operación.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {certifications.map((cert, index) => (
              <Card
                key={cert.iso}
                className="group relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-surface to-surface-secondary p-0 transition-all duration-500 hover:-translate-y-3 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="relative p-8">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                    <cert.icon className="h-8 w-8" />
                  </div>

                  <div className="mb-2 inline-block rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1.5 text-sm font-bold font-mono text-primary">
                    {cert.iso}
                  </div>

                  <h3 className="mb-4 text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {cert.title}
                  </h3>

                  <p className="text-muted leading-relaxed">
                    {cert.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span>Ver detalles</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== CTA STRIP ======================== */}
      <section className="relative z-10 mx-6 my-24 overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-r from-surface via-surface-secondary to-surface px-6 py-20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-success/5"></div>
        <div className="absolute top-0 left-1/4 h-32 w-32 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-success/10 blur-2xl"></div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            Transforma tu operación
          </div>

          <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            ¿Listo para transformar tu operación?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted leading-relaxed">
            Reduce incidentes, automatiza el cumplimiento y protege a tu equipo con tecnología de punta.
            Únete a las empresas líderes que ya confían en nosotros.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <Link href="/login">
              <Button variant="primary" size="lg" className="group relative overflow-hidden shadow-lg shadow-primary/25">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">Acceder al Dashboard</span>
                <ArrowRight className="relative z-10 ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="backdrop-blur-sm bg-surface/50 border-slate-700/50 hover:bg-surface/80">
              Agendar Consulta
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 border-t border-slate-700/50 pt-12">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted">Empresas activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-success">99.9%</div>
              <div className="text-sm text-muted">Disponibilidad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-warning">24/7</div>
              <div className="text-sm text-muted">Monitoreo continuo</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== FOOTER ======================== */}
      <footer id="contact" className="relative z-10 border-t border-slate-800 bg-surface px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Column 1: Brand */}
            <div className="md:col-span-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <ShieldCheck className="h-5 w-5 text-slate-950" />
                </div>
                <span className="text-base font-bold text-foreground">PrevenciónTech</span>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                Plataforma líder en gestión de seguridad industrial impulsada por inteligencia
                artificial. Protegiendo operaciones en toda Latinoamérica.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                Enlaces Rápidos
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard" className="text-sm text-muted transition-colors hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-muted transition-colors hover:text-foreground">
                    Acceder
                  </Link>
                </li>
                <li>
                  <a href="#demo" className="text-sm text-muted transition-colors hover:text-foreground">
                    Detección IA
                  </a>
                </li>
                <li>
                  <a href="#certifications" className="text-sm text-muted transition-colors hover:text-foreground">
                    Certificaciones
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                Soporte
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">
                    Documentación API
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">
                    Estado del Servicio
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">
                    Política de Privacidad
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Av. Industrial 1250, Piso 8<br />
                    Ciudad de México, CDMX 06600
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <a href="mailto:contacto@prevenciontech.com" className="hover:text-foreground">
                    contacto@prevenciontech.com
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <span>+52 (55) 1234-5678</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 border-t border-slate-800 pt-8 text-center">
            <p className="text-sm text-muted">
              &copy; 2026 PrevenciónTech. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
