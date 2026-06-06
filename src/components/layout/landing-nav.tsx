"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, User, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { CartDropdown } from "@/components/layout/cart-dropdown";
import { cn, getRoleDisplayName } from "@/lib/utils";
import type { Session } from "next-auth";

export default function LandingNav({ variant = "floating", session }: { variant?: "floating" | "full"; session?: Session | null }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Leemos foto personalizada subida a S3 (si existe)
  useEffect(() => {
    setCustomAvatar(localStorage.getItem("custom_avatar"));
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsProfileOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isProfileOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMobileMenuOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isMobileMenuOpen]);

  const currentRole = getRoleDisplayName((session as any)?.roles ?? []) || "Estudiante";
  const user = session?.user
    ? { name: session.user.name || "Usuario", role: currentRole }
    : null;

  const getDashboardLink = (role: string) => {
    switch (role) {
      case "Administrador": return "/admin";
      case "Jefe de Seguridad": return "/jefe";
      case "Gerente General": return "/gerencia";
      case "Operario / Empleado": return "/trabajador";
      case "Estudiante":
      case "Alumno": return "/student";
      default: return "/select-role";
    }
  };

  return (
    <header className={cn(
      "z-50 border-slate-800 bg-background/80 backdrop-blur-md transition-all duration-300",
      variant === "floating" 
        ? "fixed left-1/2 top-6 w-[95%] max-w-5xl -translate-x-1/2 rounded-full border px-6 py-3 shadow-2xl shadow-black/50" 
        : "w-full border-b px-4 sm:px-6 lg:px-8 py-3 sticky top-0"
    )}>
      <div className={cn(
        "flex items-center justify-between",
        variant === "full" ? "mx-auto max-w-7xl w-full" : "w-full"
      )}>
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight text-foreground">
              PrevenciónTech
            </span>
            <span className="text-[10px] font-medium leading-none tracking-widest text-muted uppercase">
              Seguridad Industrial
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="/#demo" className="cursor-pointer text-sm font-medium text-muted transition-colors hover:text-foreground">
            Demostración
          </a>
          <Link href="/cursos" className="cursor-pointer text-sm font-medium text-muted transition-colors hover:text-foreground">
            Cursos
          </Link>
          <a href="/#certifications" className="cursor-pointer text-sm font-medium text-muted transition-colors hover:text-foreground">
            Certificaciones
          </a>
          <a href="/#contact" className="cursor-pointer text-sm font-medium text-muted transition-colors hover:text-foreground">
            Contacto
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block flex-shrink-0 cursor-pointer" title="Perú">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 3 2" className="block rounded-sm shadow-sm opacity-80">
              <rect width="1" height="2" fill="#D91023"/>
              <rect width="1" height="2" x="1" fill="#FFFFFF"/>
              <rect width="1" height="2" x="2" fill="#D91023"/>
            </svg>
          </div>
          
          {(!user || user.role === "Estudiante" || user.role === "Alumno") && (
            <CartDropdown />
          )}

          {user ? (
            <div className="relative pl-4 border-l border-slate-800">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 overflow-hidden" title={user.name}>
                  {(customAvatar || session?.user?.image) ? (
                    <Image
                      src={customAvatar || session?.user?.image || ""}
                      alt={user.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-sm font-semibold text-foreground leading-none">{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-muted-foreground">{user.role}</span>
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <Link 
                      href={getDashboardLink(user.role)}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Mis opciones
                    </Link>
                    <div className="my-1 border-t border-slate-800"></div>
                    <button
                      onClick={() => window.location.href = '/api/auth/keycloak-logout'}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-danger/10 hover:text-danger transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="cursor-pointer">
              <Button variant="primary" size="sm" className="cursor-pointer rounded-full px-6 shadow-md">
                Acceder
              </Button>
            </Link>
          )}

          {/* Hamburger — solo móvil */}
          <button
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-slate-800/50 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Panel de navegación móvil */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop para cerrar al tocar fuera */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="Menú de navegación móvil"
            className="md:hidden absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-800 bg-background/95 backdrop-blur-md shadow-2xl shadow-black/50 p-3 flex flex-col gap-1"
          >
            <a
              href="/#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-slate-800/50 transition-colors"
            >
              Demostración
            </a>
            <Link
              href="/cursos"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-slate-800/50 transition-colors"
            >
              Cursos
            </Link>
            <a
              href="/#certifications"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-slate-800/50 transition-colors"
            >
              Certificaciones
            </a>
            <a
              href="/#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-slate-800/50 transition-colors"
            >
              Contacto
            </a>
            {!user && (
              <div className="mt-2 border-t border-slate-800 pt-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full rounded-xl">
                    Acceder
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
