"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  HardHat,
  ClipboardSignature,
  HeartPulse,
  ListChecks,
  ScanEye,
  AlertTriangle,
  FileBarChart,
  Check,
  X,
  Camera,
  ChevronRight,
  Stamp,
} from "lucide-react";

// ─── Tab definitions ────────────────────────────────────────────────────

interface SafetyTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  description: string;
  bullets: string[];
}

const tabs: SafetyTab[] = [
  {
    id: "training",
    icon: GraduationCap,
    label: "Capacitación",
    title: "Onboarding y Certificaciones",
    description:
      "Asegura que el personal conozca los riesgos antes de operar.",
    bullets: ["Validación de certificados", "Cursos online", "Firmas digitales"],
  },
  {
    id: "epp",
    icon: HardHat,
    label: "EPP",
    title: "Control de Indumentaria",
    description:
      "Rastrea y renueva los equipos de protección personal.",
    bullets: ["Alertas de caducidad", "Trazabilidad", "Stock en tiempo real"],
  },
  {
    id: "petar",
    icon: ClipboardSignature,
    label: "PETAR",
    title: "Permisos de Alto Riesgo (PETAR)",
    description:
      "Digitaliza la aprobación para trabajos en altura, caliente o confinados.",
    bullets: ["Flujos de aprobación", "Firmas en campo", "Bloqueo (LOTO)"],
  },
  {
    id: "health",
    icon: HeartPulse,
    label: "Salud",
    title: "Exámenes Médicos (EMO)",
    description:
      "Monitorea la aptitud médica y programa exámenes periódicos.",
    bullets: ["Alertas de vencimiento", "Restricciones médicas", "Historial clínico"],
  },
  {
    id: "inspections",
    icon: ListChecks,
    label: "Inspecciones",
    title: "Checklists en Campo",
    description:
      "Realiza recorridos de seguridad desde el móvil con evidencia al instante.",
    bullets: ["Modo offline", "Evidencia geolocalizada", "Asignación de tareas"],
  },
  {
    id: "cameras",
    icon: ScanEye,
    label: "Cámaras IA",
    title: "Monitoreo Inteligente",
    description:
      "Análisis de video en tiempo real para detectar la falta de EPP.",
    bullets: ["Detección instantánea", "Cero hardware especial", "Alertas automáticas"],
  },
  {
    id: "incidents",
    icon: AlertTriangle,
    label: "Incidentes",
    title: "Reporte de Incidentes",
    description:
      "Registra actos subestándar y cuasi-accidentes rápidamente.",
    bullets: ["Árbol de causas", "Notificaciones push", "Seguimiento CAPA"],
  },
  {
    id: "reports",
    icon: FileBarChart,
    label: "Reportes",
    title: "Scoring y Matrices IPERC",
    description:
      "Automatiza tus matrices de riesgo y toma decisiones con datos.",
    bullets: ["Índices de accidentabilidad", "Auditoría garantizada", "Exportación"],
  },
];

// ─── Visual components for each tab ─────────────────────────────────────

function VisualTraining() {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = 1;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative flex h-44 w-44 items-center justify-center">
        {/* Background ring */}
        <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 144 144">
          <circle
            cx="72" cy="72" r={radius}
            fill="none" stroke="#1e293b" strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="72" cy="72" r={radius}
            fill="none" stroke="#f59e0b" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        {/* Center icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GraduationCap className="h-8 w-8" />
        </div>
      </div>
      {/* Stats below */}
      <div className="ml-8 flex flex-col gap-3">
        <div className="rounded-lg bg-slate-800 px-4 py-2 text-center">
          <span className="text-lg font-bold text-emerald-400">100%</span>
          <p className="text-[10px] text-muted">Completado</p>
        </div>
        <div className="rounded-lg bg-slate-800 px-4 py-2 text-center">
          <span className="text-lg font-bold text-foreground">24</span>
          <p className="text-[10px] text-muted">Certificados</p>
        </div>
      </div>
    </div>
  );
}

function VisualEPP() {
  const items = [
    { name: "Casco", status: "ok", expiry: "Vence Dic 2026" },
    { name: "Lentes", status: "ok", expiry: "Vence Mar 2027" },
    { name: "Botas", status: "warn", expiry: "Vence May 2026" },
  ];

  return (
    <div className="flex flex-col gap-3 py-6">
      <div className="rounded-lg border border-slate-800 bg-slate-800/50 px-4 py-3">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Obrero #4821</span>
      </div>
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                item.status === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}
            >
              <HardHat className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-foreground">{item.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">{item.expiry}</span>
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                item.status === "ok" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualPETAR() {
  return (
    <div className="flex gap-4 py-6">
      {/* Document left */}
      <div className="flex-1 rounded-lg border border-slate-800 bg-slate-800/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardSignature className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">PETAR-0047</span>
        </div>
        <div className="space-y-2">
          {["Trabajo en altura > 1.8m", "Zona confinada verificada", "Extintor disponible", "Vigía asignado"].map(
            (item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-slate-300">{item}</span>
              </div>
            )
          )}
        </div>
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span>🖊️ Supervisor: R. Díaz</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span>📅 14 Abr 2026 — 08:30</span>
          </div>
        </div>
      </div>

      {/* Approval stamp right */}
      <div className="flex w-32 flex-col items-center justify-center">
        <div className="flex h-24 w-24 rotate-12 items-center justify-center rounded-full border-4 border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <div className="flex flex-col items-center">
            <Stamp className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Aprobado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualHealth() {
  const exams = [
    { date: "15 Ene", label: "EMO General", status: "ok" },
    { date: "15 Abr", label: "Audiometría", status: "ok" },
    { date: "15 Jul", label: "Espirometría", status: "ok" },
    { date: "15 Oct", label: "EMO Anual", status: "danger" },
  ];

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Calendario EMO 2026</span>
        <HeartPulse className="h-4 w-4 text-rose-400" />
      </div>
      {/* Timeline */}
      <div className="relative pl-6">
        <div className="absolute left-2.5 top-1 bottom-1 w-px bg-slate-700" />
        <div className="space-y-4">
          {exams.map((exam, i) => (
            <div key={i} className="relative flex items-center gap-3">
              {/* Dot on timeline */}
              <div
                className={`absolute -left-6 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 ${
                  exam.status === "ok"
                    ? "border-emerald-500 bg-background"
                    : "border-rose-500 bg-rose-500 animate-pulse"
                }`}
              />
              <div
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  exam.status === "danger"
                    ? "border-rose-800/50 bg-rose-500/10"
                    : "border-slate-800 bg-slate-800/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{exam.label}</span>
                  <span className="text-[10px] text-muted">{exam.date}</span>
                </div>
                {exam.status === "danger" && (
                  <span className="mt-1 text-[10px] font-medium text-rose-400">VENCIDO</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualInspections() {
  return (
    <div className="flex items-center justify-center py-6">
      {/* Phone mockup */}
      <div className="relative h-64 w-36 rounded-3xl border-2 border-slate-700 bg-slate-900 p-3 shadow-xl">
        {/* Notch */}
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-700" />

        {/* Screen content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-foreground">Checklist #12</span>
            <span className="text-[8px] text-muted">Zona N</span>
          </div>

          {/* Checklist items */}
          {[
            { label: "Extintor vigente", done: true },
            { label: "Señalización OK", done: true },
            { label: "Iluminación", done: true },
            { label: "Piso sin riesgo", done: false },
            { label: "EPP disponible", done: true },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[8px] ${
                item.done ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-muted"
              }`}
            >
              {item.done ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <X className="h-2.5 w-2.5" />
              )}
              <span>{item.label}</span>
            </div>
          ))}

          {/* Camera simulation */}
          <div className="relative mt-2 flex h-16 items-center justify-center rounded-lg bg-slate-800">
            <Camera className="h-5 w-5 text-muted" />
            <span className="absolute bottom-1 right-1 text-[6px] text-muted">📷 Foto</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualCameras() {
  return (
    <div className="py-6">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Silhouette */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-8 w-8 rounded-full bg-slate-700/40" />
          <div className="mx-auto -mt-1 h-14 w-12 rounded-lg bg-slate-700/30" />
        </div>

        {/* Bounding box 1 — helmet */}
        <div className="absolute left-[30%] top-[15%] h-[22%] w-[40%] rounded border-2 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
          <div className="absolute -top-5 left-0">
            <Badge variant="success" className="text-[8px]">
              Casco 98%
            </Badge>
          </div>
        </div>

        {/* Bounding box 2 — vest */}
        <div className="absolute left-[25%] top-[40%] h-[30%] w-[48%] rounded border-2 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
          <div className="absolute -top-5 left-0">
            <Badge variant="warning" className="text-[8px]">
              Chaleco 87%
            </Badge>
          </div>
        </div>

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 to-transparent px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono text-emerald-400">CAM-E07 ● REC</span>
            <span className="text-[8px] font-mono text-slate-500">IA v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualIncidents() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      {/* Flow step 1 */}
      <div className="flex w-48 items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
        <AlertTriangle className="h-5 w-5 text-rose-400" />
        <div>
          <span className="text-xs font-medium text-foreground">Incidente reportado</span>
          <p className="text-[9px] text-muted">Caída de objeto</p>
        </div>
      </div>

      {/* Arrow down */}
      <ChevronRight className="h-4 w-4 rotate-90 text-slate-600" />

      {/* Flow step 2 */}
      <div className="flex w-48 items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
        <ListChecks className="h-5 w-5 text-primary" />
        <div>
          <span className="text-xs font-medium text-foreground">Análisis de causa</span>
          <p className="text-[9px] text-muted">Árbol de causas raíz</p>
        </div>
      </div>

      {/* Arrow down */}
      <ChevronRight className="h-4 w-4 rotate-90 text-slate-600" />

      {/* Flow step 3 */}
      <div className="flex w-48 items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
        <ClipboardSignature className="h-5 w-5 text-primary" />
        <div>
          <span className="text-xs font-medium text-foreground">CAPA asignada</span>
          <p className="text-[9px] text-muted">Acción correctiva</p>
        </div>
      </div>

      {/* Arrow down */}
      <ChevronRight className="h-4 w-4 rotate-90 text-slate-600" />

      {/* Flow step 4 — Resolved */}
      <div className="flex w-48 items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
        <Check className="h-5 w-5 text-emerald-400" />
        <div>
          <span className="text-xs font-bold text-emerald-400">Solucionado</span>
          <p className="text-[9px] text-emerald-400/60">Cierre validado</p>
        </div>
      </div>
    </div>
  );
}

function VisualReports() {
  const bars = [
    { label: "Ene", height: "h-16", color: "from-amber-500/60 to-amber-500", value: 12 },
    { label: "Feb", height: "h-12", color: "from-amber-500/50 to-amber-500/80", value: 8 },
    { label: "Mar", height: "h-24", color: "from-rose-500/60 to-rose-500", value: 20 },
    { label: "Abr", height: "h-8", color: "from-emerald-500/60 to-emerald-500", value: 4 },
    { label: "May", height: "h-14", color: "from-amber-500/50 to-amber-500/80", value: 10 },
    { label: "Jun", height: "h-6", color: "from-emerald-500/60 to-emerald-500", value: 3 },
  ];

  return (
    <div className="flex flex-col items-center py-6">
      <span className="mb-4 text-[10px] font-semibold text-muted uppercase tracking-wider">
        Tasa de Incidentes Mensual
      </span>
      <div className="flex items-end gap-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-foreground">{bar.value}</span>
            <div
              className={`w-8 rounded-t-md bg-gradient-to-t ${bar.color} ${bar.height} transition-all duration-500`}
            />
            <span className="text-[8px] text-muted">{bar.label}</span>
          </div>
        ))}
      </div>

      {/* KPI strip */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
          <span className="text-xs font-bold text-emerald-400">↓ 75%</span>
          <p className="text-[8px] text-muted">Reducción</p>
        </div>
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
          <span className="text-xs font-bold text-foreground">99.2%</span>
          <p className="text-[8px] text-muted">Auditoría</p>
        </div>
      </div>
    </div>
  );
}

// Map tab IDs to visual components
const visuals: Record<string, React.ComponentType> = {
  training: VisualTraining,
  epp: VisualEPP,
  petar: VisualPETAR,
  health: VisualHealth,
  inspections: VisualInspections,
  cameras: VisualCameras,
  incidents: VisualIncidents,
  reports: VisualReports,
};

// ─── Main component ─────────────────────────────────────────────────────

export default function SafetyCycle() {
  const [activeTab, setActiveTab] = useState("training");
  const activeData = tabs.find((t) => t.id === activeTab)!;
  const ActiveVisual = visuals[activeTab];

  return (
    <section id="safety-cycle" className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Gestiona el riesgo de principio a fin
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Badge className="bg-slate-800 text-primary hover:bg-slate-800">PREVENCIÓN</Badge>
            <Badge className="bg-slate-800 text-primary hover:bg-slate-800">OPERACIÓN</Badge>
            <Badge className="bg-slate-800 text-primary hover:bg-slate-800">CONTROL Y AUDITORÍA</Badge>
          </div>
        </div>

        {/* ─── Tab navigation ─────────────────────────────────── */}
        <div className="mb-10 flex justify-center">
          <div className="flex gap-2 overflow-x-auto rounded-xl bg-slate-900/50 p-2 md:gap-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 md:px-4 md:py-2.5 md:text-sm ${
                    isActive
                      ? "bg-primary text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Content area ───────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2"
          >
            {/* Left: text */}
            <div className="flex flex-col justify-center">
              <div className="mb-2 inline-flex items-center gap-2">
                <activeData.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {activeData.label}
                </span>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">{activeData.title}</h3>
              <p className="mb-6 text-base text-muted">{activeData.description}</p>

              <ul className="space-y-3">
                {activeData.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm text-slate-300">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: visual */}
            <div className="rounded-xl border border-slate-800 bg-surface p-4">
              <ActiveVisual />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
