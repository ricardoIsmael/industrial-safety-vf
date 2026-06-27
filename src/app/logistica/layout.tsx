"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, FileText, BarChart3, LogOut, ClipboardList, Headphones } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function LogisticaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = () => {
    const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    const idToken = session?.idToken;
    let logoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin + "/login")}&client_id=${clientId}`;
    if (idToken) logoutUrl += `&id_token_hint=${idToken}`;
    signOut({ redirect: false }).then(() => {
      window.location.href = logoutUrl;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-surface/50 backdrop-blur-xl flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-foreground tracking-tight">Logística</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            <Link href="/logistica" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/logistica' ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/logistica/solicitudes" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes('/solicitudes') ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <FileText className="h-4 w-4" /> Solicitudes de Compra
            </Link>
            <Link href="/logistica/aprobaciones" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/aprobaciones") ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <ClipboardList className="h-4 w-4" /> Estado de Solicitudes
            </Link>
            <Link href="/logistica/support" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/support") ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <Headphones className="h-4 w-4" /> Soporte TI
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
