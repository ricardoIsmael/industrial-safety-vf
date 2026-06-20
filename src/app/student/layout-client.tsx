"use client";

import type { Session } from "next-auth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import LandingNav from "@/components/layout/landing-nav";

const studentTabs = [
  { href: "/student", label: "Todos los cursos" },
  { href: "/student/learning", label: "Mis listas" },
  { href: "/student/certificates", label: "Certificaciones" },
  { href: "/student/payment-vouchers", label: "Vouchers" },
  { href: "/student/support", label: "Soporte" },
  { href: "/student/profile", label: "Mi Perfil" },
];

export default function StudentLayoutClient({
  children,
  session
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      {/* Global Navbar - recibe la sesión de NextAuth */}
      <LandingNav variant="full" session={session} />

      {/* Udemy-style Dark Header */}
      <div className="bg-slate-950 border-b border-slate-800 pt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-white mb-8">Mi aprendizaje</h1>
          
          <nav className="flex items-center gap-8 overflow-x-auto pb-0 scrollbar-hide">
            {studentTabs.map((tab) => {
              const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== '/student');
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "pb-3 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors",
                    isActive 
                      ? "border-amber-400 text-white" 
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-[#11131c] py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
