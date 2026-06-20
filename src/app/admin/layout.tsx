"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck, Activity, Users, Video, Settings, GraduationCap, Menu, X, LogOut, Headphones, UserCog } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Activity },
  { name: "Staff & Accesos", href: "/admin/staff", icon: Users },
  { name: "Hardware", href: "/admin/hardware", icon: Video },
  { name: "Integraciones", href: "/admin/settings", icon: Settings },
  { name: "Asignar Cursos", href: "/admin/course-assignment", icon: GraduationCap },
  { name: "Accesos", href: "/admin/accesos", icon: UserCog },
  { name: "Soporte", href: "/admin/support", icon: Headphones },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const handleLogout = () => {
    const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    const idToken = session?.idToken;
    let logoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin + "/login")}&client_id=${clientId}`;
    if (idToken) logoutUrl += `&id_token_hint=${idToken}`;
    signOut({ redirect: false }).then(() => {
      window.location.href = logoutUrl;
    });
  }

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-foreground">Admin Portal</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 md:h-full",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-border">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <span className="font-bold text-xl text-foreground tracking-tight">Admin Portal</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors relative group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted hover:bg-surface-secondary hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted group-hover:text-foreground")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User profile / Logout / Return to app */}
        <div className="p-4 border-t border-border space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-danger hover:bg-danger/10 hover:text-danger"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Button>

          <Link href="/">
            <Button variant="outline" className="w-full justify-start gap-2 border-border text-muted hover:text-foreground">
              ← Volver a la Web
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
