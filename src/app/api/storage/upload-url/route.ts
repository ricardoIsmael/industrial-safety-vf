import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Usamos el wrapper auth() para asegurar que la sesión se capture correctamente en la API Route
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = auth(async (req: any) => {
  const session = req.auth;
  console.log("DEBUG: Session keys:", session ? Object.keys(session) : "No session");
  console.log("DEBUG: Access Token present?:", !!session?.accessToken);

  if (!session?.accessToken) {
    console.log("DEBUG: Unauthorized - Access Token missing");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const fileName = searchParams.get("fileName");
  const contentType = searchParams.get("contentType");

  if (!fileName || !contentType) {
    return NextResponse.json({ error: "fileName y contentType son requeridos" }, { status: 400 });
  }

  // Llamamos al backend desde el SERVIDOR (sin CORS)
  try {
    const backendRes = await fetch(
      `${process.env.API_URL}/api/v1/storage/upload-url?fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      const authHeader = backendRes.headers.get("www-authenticate");
      console.error(`DEBUG: Backend Error Status: ${backendRes.status}`);
      console.error(`DEBUG: Backend WWW-Authenticate: ${authHeader}`);
      return NextResponse.json({ 
        error: `Error backend: ${errorText}`,
        details: authHeader 
      }, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: `Error de conexión: ${error.message}` }, { status: 500 });
  }
});
