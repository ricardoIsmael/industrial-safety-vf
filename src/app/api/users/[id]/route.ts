import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.accessToken) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/users/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PUT = auth(async (req) => {
  const session = req.auth;
  if (!session?.accessToken) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  try {
    const body = await req.json();
    const res = await fetch(`${process.env.API_URL}/api/v1/users/admin/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
