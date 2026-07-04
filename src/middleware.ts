import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/" ||
    pathname === "/select-role" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/proxy/course") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/cursos") ||
    pathname.startsWith("/register");

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn) {
    // Prefer roles from session, fall back to JWT decode
    let roles: string[] = (req.auth as any)?.roles || [];

    if (!roles.length) {
      const accessToken = (req.auth as any)?.accessToken;
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split(".")[1]));
          roles = payload.realm_access?.roles || [];
        } catch (_) {}
      }
    }

    const hasRole = (role: string) =>
      roles.includes(role) || roles.includes(`ROLE_${role}`);

    const isAdmin        = hasRole("ADMINISTRADOR");
    const isSoporte      = hasRole("SOPORTE");
    const isGerencia     = hasRole("GERENCIA_GENERAL");
    const isJefe         = hasRole("JEFE_SEGURIDAD");
    const isLogistica    = hasRole("LOGISTICA_ALMACEN");
    const isMarketing    = hasRole("MARKETING");
    const isTrabajador   = hasRole("TRABAJADOR");
    const isInstructor   = hasRole("INSTRUCTOR");

    let targetDashboard = "/student";
    if (isAdmin)       targetDashboard = "/admin";
    else if (isSoporte)    targetDashboard = "/soporte";
    else if (isGerencia)   targetDashboard = "/gerencia";
    else if (isJefe)       targetDashboard = "/jefatura";
    else if (isLogistica)  targetDashboard = "/logistica";
    else if (isMarketing)  targetDashboard = "/marketing";
    else if (isTrabajador) targetDashboard = "/trabajador";
    else if (isInstructor) targetDashboard = "/instructor";

    const mustChangePassword = (req.auth as any)?.mustChangePassword === true;

    // Forzar cambio de contraseña antes de cualquier otra redirección
    if (mustChangePassword && !pathname.startsWith("/auth/set-password") && !pathname.startsWith("/api/")) {
      const email = (req.auth as any)?.user?.email ?? "";
      return NextResponse.redirect(
        new URL(`/auth/set-password?email=${encodeURIComponent(email)}`, req.nextUrl)
      );
    }

    // Ya logueado: redirigir fuera de login / root
    if (pathname === "/login" || pathname === "/register" || pathname === "/") {
      return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    }

    // Protección de rutas por rol
    if (pathname.startsWith("/admin")      && !isAdmin)                    return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/soporte")    && !isSoporte)                  return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/gerencia")   && !isGerencia   && !isAdmin)   return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/marketing")  && !isMarketing  && !isAdmin)   return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/instructor") && !isInstructor && !isAdmin)   return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/jefatura")   && !isJefe       && !isAdmin)   return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/logistica")  && !isLogistica  && !isAdmin)   return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/trabajador") && !isTrabajador && !isAdmin)   return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
    if (pathname.startsWith("/student")    && !isLoggedIn)                 return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
