import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

async function safeJson(response: Response) {
    const text = await response.text()
    try {
        return JSON.parse(text)
    } catch (e) {
        return { message: text }
    }
}

function getSession() {
    return auth()
}

function invalidSession(session: any) {
    if (!session) return true
    if ((session as any).error === "RefreshAccessTokenError") return true
    if ((session as any).error === "BackendUnavailableError") return true
    if (!(session as any).accessToken) return true
    return false
}

function buildTargetUrl(req: NextRequest, path: string) {
    const queryString = req.nextUrl.searchParams.toString()
    const base = `${process.env.API_URL}/api/v1/${path}`
    return queryString ? `${base}?${queryString}` : base
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParamsGet = await params
    const pathGet = resolvedParamsGet.path.join("/")
    // Rutas públicas que no requieren sesión
    const isPublicGet = pathGet === "course" || pathGet.startsWith("course/")
    const session = isPublicGet ? null : await getSession()
    if (!isPublicGet && invalidSession(session)) return NextResponse.json({ error: "No session" }, { status: 401 })

    const targetUrl = buildTargetUrl(req, pathGet)

    const getHeaders: Record<string, string> = {}
    if (session && (session as any).accessToken) {
        getHeaders["Authorization"] = `Bearer ${(session as any).accessToken}`
    }
    const getUserId = req.headers.get("x-user-id")
    if (getUserId) getHeaders["X-User-Id"] = getUserId

    try {
        const response = await fetch(targetUrl, {
            headers: getHeaders
        })
        const data = await safeJson(response)
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error("Proxy GET Error:", error)
        return NextResponse.json({ error: "Proxy error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params
    const path = resolvedParams.path.join("/")

    // Allow unauthenticated registration
    const isPublic = path === "users/register"
    const session = isPublic ? null : await getSession()
    if (!isPublic && invalidSession(session)) return NextResponse.json({ error: "No session" }, { status: 401 })
    const targetUrl = buildTargetUrl(req, path)

    const contentType = req.headers.get("content-type") ?? ""

    // Multipart form-data (file uploads — e.g. exam xlsx)
    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData()
        const fetchHeaders: Record<string, string> = {}
        if (session && (session as any).accessToken) {
            fetchHeaders["Authorization"] = `Bearer ${(session as any).accessToken}`
        }
        try {
            const response = await fetch(targetUrl, {
                method: "POST",
                headers: fetchHeaders,
                body: formData,
            })
            const data = await safeJson(response)
            return NextResponse.json(data, { status: response.status })
        } catch (error) {
            console.error("Proxy POST multipart Error:", error)
            return NextResponse.json({ error: "Proxy error" }, { status: 500 })
        }
    }

    let body = {}
    try {
        body = await req.json()
    } catch (e) {}

    const postHeaders: Record<string, string> = { "Content-Type": "application/json" }
    if (session && (session as any).accessToken) {
        postHeaders["Authorization"] = `Bearer ${(session as any).accessToken}`
    }
    const postUserId = req.headers.get("x-user-id")
    if (postUserId) postHeaders["X-User-Id"] = postUserId

    try {
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: postHeaders,
            body: JSON.stringify(body)
        })
        const data = await safeJson(response)
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error("Proxy POST Error:", error)
        return NextResponse.json({ error: "Proxy error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const session = await getSession()
    if (invalidSession(session)) return NextResponse.json({ error: "No session" }, { status: 401 })

    const resolvedParams = await params
    const path = resolvedParams.path.join("/")
    const targetUrl = buildTargetUrl(req, path)

    let body = {}
    try {
        body = await req.json()
    } catch (e) {}

    try {
        const response = await fetch(targetUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${(session as any).accessToken}`
            },
            body: JSON.stringify(body)
        })
        const data = await safeJson(response)
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error("Proxy PUT Error:", error)
        return NextResponse.json({ error: "Proxy error" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const session = await getSession()
    if (invalidSession(session)) return NextResponse.json({ error: "No session" }, { status: 401 })

    const resolvedParams = await params
    const path = resolvedParams.path.join("/")
    const targetUrl = buildTargetUrl(req, path)

    let body = {}
    try {
        body = await req.json()
    } catch (e) {}

    const patchHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(session as any).accessToken}`
    }
    const patchUserId = req.headers.get("x-user-id")
    if (patchUserId) patchHeaders["X-User-Id"] = patchUserId

    try {
        const response = await fetch(targetUrl, {
            method: "PATCH",
            headers: patchHeaders,
            body: JSON.stringify(body)
        })
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 })
        }
        const data = await safeJson(response)
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error("Proxy PATCH Error:", error)
        return NextResponse.json({ error: "Proxy error" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const session = await getSession()
    if (invalidSession(session)) return NextResponse.json({ error: "No session" }, { status: 401 })

    const resolvedParams = await params
    const path = resolvedParams.path.join("/")
    const targetUrl = buildTargetUrl(req, path)

    try {
        const response = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${(session as any).accessToken}`
            }
        })
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 })
        }
        const data = await safeJson(response)
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error("Proxy DELETE Error:", error)
        return NextResponse.json({ error: "Proxy error" }, { status: 500 })
    }
}