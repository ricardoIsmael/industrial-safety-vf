import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

/**
 * Puente server-side con Jira Cloud. Usado por los módulos de
 * Control de Cambios (proyecto CDC) e Información/Reportes (proyecto GDD).
 *
 * Requiere en el entorno (Vercel): JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN.
 */
const BASE = process.env.JIRA_BASE_URL
const EMAIL = process.env.JIRA_EMAIL
const TOKEN = process.env.JIRA_API_TOKEN

function authHeader() {
    return "Basic " + Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64")
}

function adf(text: string) {
    return {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: text && text.trim() ? text : " " }] }],
    }
}

function jiraConfigured() {
    return Boolean(BASE && EMAIL && TOKEN)
}

// Las labels de Jira no admiten espacios
function sanitizeLabel(s: string) {
    return (s || "").trim().replace(/\s+/g, "-")
}

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
    if (!jiraConfigured()) return NextResponse.json({ error: "Jira no configurado", issues: [] }, { status: 503 })

    const project = (req.nextUrl.searchParams.get("project") || "CDC").replace(/[^A-Za-z0-9]/g, "")
    const jql = encodeURIComponent(`project = ${project} ORDER BY created DESC`)

    try {
        const res = await fetch(
            `${BASE}/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,priority,created,issuetype,labels,description`,
            { headers: { Authorization: authHeader(), Accept: "application/json" } }
        )
        if (!res.ok) return NextResponse.json({ error: "Jira error", issues: [] }, { status: res.status })
        const data = await res.json()
        const issues = (data.issues || []).map((i: any) => ({
            key: i.key,
            summary: i.fields?.summary ?? "",
            status: i.fields?.status?.name ?? "—",
            statusCategory: i.fields?.status?.statusCategory?.key ?? "new",
            priority: i.fields?.priority?.name ?? null,
            issueType: i.fields?.issuetype?.name ?? null,
            labels: i.fields?.labels ?? [],
            created: i.fields?.created ?? null,
            url: `${BASE}/browse/${i.key}`,
        }))
        return NextResponse.json({ issues })
    } catch {
        return NextResponse.json({ error: "Jira fetch failed", issues: [] }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
    if (!jiraConfigured()) return NextResponse.json({ error: "Jira no configurado" }, { status: 503 })

    const body = await req.json().catch(() => ({} as any))
    const project: string = (body.project || "CDC").replace(/[^A-Za-z0-9]/g, "")
    const summary: string = body.summary
    const description: string = body.description || ""
    const issueType: string = body.issueType || "Task"
    const labels: string[] = Array.isArray(body.labels) ? body.labels.map(sanitizeLabel).filter(Boolean) : []

    if (!summary) return NextResponse.json({ error: "summary requerido" }, { status: 400 })

    const fields: Record<string, unknown> = {
        project: { key: project },
        summary,
        issuetype: { name: issueType },
        description: adf(description),
    }
    if (labels.length) fields.labels = labels

    try {
        const res = await fetch(`${BASE}/rest/api/3/issue`, {
            method: "POST",
            headers: { Authorization: authHeader(), Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ fields }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return NextResponse.json({ error: "No se pudo crear en Jira", detail: data }, { status: res.status })
        return NextResponse.json({ key: data.key, url: `${BASE}/browse/${data.key}` })
    } catch {
        return NextResponse.json({ error: "Jira create failed" }, { status: 500 })
    }
}
