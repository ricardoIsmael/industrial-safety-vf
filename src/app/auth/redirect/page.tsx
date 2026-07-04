import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session as any).mustChangePassword) {
    const email = session?.user?.email ?? "";
    redirect(`/auth/set-password?email=${encodeURIComponent(email)}`);
  }

  const roles: string[] = (session as any).roles || [];

  if (roles.includes("ADMINISTRADOR") || roles.includes("ROLE_ADMINISTRADOR")) {
    redirect("/admin");
  }
  if (roles.includes("INSTRUCTOR") || roles.includes("ROLE_INSTRUCTOR")) {
    redirect("/instructor");
  }
  if (roles.includes("TRABAJADOR") || roles.includes("ROLE_TRABAJADOR")) {
    redirect("/trabajador");
  }
  if (roles.includes("JEFE_SEGURIDAD") || roles.includes("ROLE_JEFE_SEGURIDAD")) {
    redirect("/jefe");
  }
  if (roles.includes("GERENCIA_GENERAL") || roles.includes("ROLE_GERENCIA_GENERAL")) {
    redirect("/gerencia");
  }
  if (roles.includes("MARKETING") || roles.includes("ROLE_MARKETING")) {
    redirect("/marketing");
  }
  if (roles.includes("LOGISTICA_ALMACEN") || roles.includes("ROLE_LOGISTICA_ALMACEN")) {
    redirect("/logistica");
  }
  if (roles.includes("SOPORTE") || roles.includes("ROLE_SOPORTE")) {
    redirect("/soporte");
  }

  redirect("/student");
}
