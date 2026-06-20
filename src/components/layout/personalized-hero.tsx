"use client";

import { motion } from "framer-motion";
import type { Session } from "next-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, PlayCircle, LayoutDashboard } from "lucide-react";
import { getRoleDisplayName } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export function PersonalizedHero({ session }: { session: Session | null }) {
  const currentRole = getRoleDisplayName(session?.roles ?? []);
  const firstName = (session?.user?.name ?? "").split(" ")[0];

  const getDashboardLink = (role: string) => {
    switch (role) {
      case "Jefe de Seguridad": return "/jefe";
      case "Gerente General": return "/gerencia";
      case "Operario / Empleado": return "/trabajador";
      case "Estudiante":
      case "Alumno": return "/student";
      default: return "/select-role";
    }
  };

  if (session?.user && currentRole) {
    const isStudent = currentRole === "Estudiante";

    return (
      <motion.div
        {...fadeUp}
        className="relative z-10 mx-auto max-w-5xl text-center"
      >
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-2 text-sm font-medium text-primary backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          ¡Hola de nuevo, {firstName}! Tienes novedades esperándote.
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Continúa tu{" "}
          <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent animate-gradient-x">
            Capacitación
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-3xl text-xl text-muted md:text-2xl leading-relaxed">
          Tu progreso es excelente. Sigue fortaleciendo tus habilidades en seguridad industrial
          y mantén tu certificación al día.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          <Link href={getDashboardLink(currentRole)}>
            <Button variant="primary" size="lg" className="group relative overflow-hidden px-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                Ir a mi Dashboard <LayoutDashboard className="h-5 w-5" />
              </span>
            </Button>
          </Link>
          {isStudent && (
            <Link href="/student/learning">
              <Button variant="secondary" size="lg" className="backdrop-blur-sm bg-surface/50 border-slate-700/50 hover:bg-surface/80 flex gap-2">
                <PlayCircle className="h-5 w-5 text-primary" /> Continuar Cursos
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...fadeUp}
      className="relative z-10 mx-auto max-w-5xl text-center"
    >
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-2 text-sm font-medium text-primary backdrop-blur-sm">
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        Plataforma empresarial en producción
      </div>

      <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
        Tecnología en{" "}
        <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent animate-gradient-x">
          Prevención de Riesgos
        </span>
      </h1>

      <p className="mx-auto mt-8 max-w-3xl text-xl text-muted md:text-2xl leading-relaxed">
        Líderes en seguridad industrial con inteligencia artificial. Detectamos infracciones
        de EPP en tiempo real para las operaciones más exigentes.
      </p>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
        <Link href="/login">
          <Button variant="primary" size="lg" className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">Solicitar Demostración</span>
            <ArrowRight className="relative z-10 ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <a href="#demo">
          <Button variant="secondary" size="lg" className="backdrop-blur-sm bg-surface/50 border-slate-700/50 hover:bg-surface/80">
            Ver Tecnología en Acción
          </Button>
        </a>
      </div>
    </motion.div>
  );
}
