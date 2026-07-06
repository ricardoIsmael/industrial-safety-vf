"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    BookOpen, Loader2, RefreshCw, Search, ArrowLeft, Eye, Plus, X, Clock, Tag,
} from "lucide-react";
import {
    abrirArticulo, crearArticulo, getArticulos, categoriaArticuloMeta,
    type Articulo, type ArticuloResumen, type CategoriaArticulo,
} from "@/services/conocimientoService";

const CATEGORIAS = Object.keys(categoriaArticuloMeta) as CategoriaArticulo[];

/** Estilos del contenido Markdown (tablas GFM incluidas), consistentes con el tema. */
const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
    h1: (p) => <h1 className="text-xl font-bold mt-6 mb-3" {...p} />,
    h2: (p) => <h2 className="text-lg font-bold mt-6 mb-2 border-b border-border pb-1" {...p} />,
    h3: (p) => <h3 className="text-base font-semibold mt-4 mb-2" {...p} />,
    p: (p) => <p className="text-sm leading-relaxed mb-3" {...p} />,
    ul: (p) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm" {...p} />,
    ol: (p) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm" {...p} />,
    li: (p) => <li className="leading-relaxed" {...p} />,
    a: (p) => <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...p} />,
    blockquote: (p) => (
        <blockquote className="border-l-2 border-primary/50 bg-primary/5 pl-3 py-1 my-3 text-sm text-muted" {...p} />
    ),
    code: (p) => <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs font-mono" {...p} />,
    pre: (p) => (
        <pre className="rounded-lg border border-border bg-surface-secondary p-3 my-3 overflow-x-auto text-xs font-mono [&>code]:bg-transparent [&>code]:p-0" {...p} />
    ),
    table: (p) => (
        <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border border-border" {...p} />
        </div>
    ),
    thead: (p) => <thead className="bg-surface-secondary" {...p} />,
    th: (p) => <th className="border border-border px-3 py-2 text-left text-xs font-semibold" {...p} />,
    td: (p) => <td className="border border-border px-3 py-2 align-top" {...p} />,
    hr: () => <hr className="border-border my-4" />,
};

export default function ConocimientoPage() {
    const { data: session } = useSession();
    const autorId = session?.keycloakId as string | undefined;

    const [items, setItems] = useState<ArticuloResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [q, setQ] = useState("");
    const [categoria, setCategoria] = useState<CategoriaArticulo | "">("");

    // Vista de detalle
    const [abierto, setAbierto] = useState<Articulo | null>(null);
    const [abriendo, setAbriendo] = useState<number | null>(null);

    // Modal de nuevo artículo (soporte documenta soluciones → la KB crece)
    const [creando, setCreando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [nuevo, setNuevo] = useState({
        titulo: "", resumen: "", categoria: "RUNBOOK" as CategoriaArticulo, etiquetas: "", contenido: "",
    });

    const cargar = async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(await getArticulos({ categoria: categoria || undefined, q: q || undefined }));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar la base de conocimiento");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [categoria]);

    const handleAbrir = async (id: number) => {
        setAbriendo(id);
        setError(null);
        try {
            setAbierto(await abrirArticulo(id));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al abrir el artículo");
        } finally {
            setAbriendo(null);
        }
    };

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!autorId) return;
        if (!nuevo.titulo.trim() || !nuevo.contenido.trim()) {
            setError("El título y el contenido son obligatorios");
            return;
        }
        setGuardando(true);
        setError(null);
        try {
            await crearArticulo(autorId, {
                titulo: nuevo.titulo.trim(),
                resumen: nuevo.resumen.trim() || undefined,
                categoria: nuevo.categoria,
                etiquetas: nuevo.etiquetas.trim() || undefined,
                contenido: nuevo.contenido,
                autorNombre: (session?.user?.name as string) ?? undefined,
            });
            setCreando(false);
            setNuevo({ titulo: "", resumen: "", categoria: "RUNBOOK", etiquetas: "", contenido: "" });
            await cargar();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al crear el artículo");
        } finally {
            setGuardando(false);
        }
    };

    const cuentaPorCategoria = useMemo(() => {
        const m = new Map<CategoriaArticulo, number>();
        items.forEach(a => m.set(a.categoria, (m.get(a.categoria) ?? 0) + 1));
        return m;
    }, [items]);

    // ── Vista de detalle ─────────────────────────────────────────────────────────
    if (abierto) {
        const meta = categoriaArticuloMeta[abierto.categoria];
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <Button variant="outline" className="border-border gap-2" onClick={() => setAbierto(null)}>
                    <ArrowLeft className="h-4 w-4" /> Volver a la base de conocimiento
                </Button>
                <Card className="p-6 border-border bg-surface/50">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={cn("border", meta.cls)}>{meta.label}</Badge>
                        <span className="text-xs text-muted">{abierto.codigo}</span>
                        <span className="text-xs text-muted flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> {abierto.vistas} vistas
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(abierto.updatedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">{abierto.titulo}</h1>
                    {abierto.autor && <p className="text-xs text-muted mb-4">Por {abierto.autor}</p>}
                    <div className="border-t border-border pt-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {abierto.contenido}
                        </ReactMarkdown>
                    </div>
                    {abierto.etiquetas && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-border">
                            <Tag className="h-3.5 w-3.5 text-muted" />
                            {abierto.etiquetas.split(",").map(t => (
                                <Badge key={t} variant="outline" className="border-border text-muted text-[10px]">
                                    {t.trim()}
                                </Badge>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    // ── Listado ──────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Base de Conocimiento</h1>
                        <p className="text-sm text-muted">
                            Planes de continuidad, DRP, respaldos, políticas y runbooks del equipo TI
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="gap-2" onClick={() => setCreando(true)}>
                        <Plus className="h-4 w-4" /> Nuevo artículo
                    </Button>
                    <Button variant="outline" size="icon" onClick={cargar} className="border-border">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Búsqueda */}
            <form
                onSubmit={e => { e.preventDefault(); cargar(); }}
                className="flex items-center gap-2 flex-wrap"
            >
                <div className="relative flex-1 min-w-60 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <Input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Buscar (ej. snapshot, RTO, 3-2-1, umbral...)"
                        className="pl-9"
                    />
                </div>
                <Button type="submit" variant="outline" className="border-border">Buscar</Button>
            </form>

            {/* Chips de categoría */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <button
                    onClick={() => setCategoria("")}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        categoria === ""
                            ? "bg-primary/10 text-primary border-primary/40"
                            : "border-border text-muted hover:text-foreground"
                    )}
                >
                    Todas
                </button>
                {CATEGORIAS.map(c => (
                    <button
                        key={c}
                        onClick={() => setCategoria(categoria === c ? "" : c)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            categoria === c ? categoriaArticuloMeta[c].cls : "border-border text-muted hover:text-foreground"
                        )}
                    >
                        {categoriaArticuloMeta[c].label}
                        {cuentaPorCategoria.get(c) ? ` · ${cuentaPorCategoria.get(c)}` : ""}
                    </button>
                ))}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Lista de artículos */}
            {loading ? (
                <div className="flex items-center justify-center h-40 text-muted">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando artículos...
                </div>
            ) : items.length === 0 ? (
                <Card className="p-10 text-center text-muted border-border">
                    No hay artículos{q || categoria ? " con esos filtros" : " todavía"}.
                </Card>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {items.map(a => {
                        const meta = categoriaArticuloMeta[a.categoria];
                        return (
                            <button key={a.id} onClick={() => handleAbrir(a.id)} className="text-left">
                                <Card className="p-4 border-border bg-surface/50 h-full hover:bg-surface-secondary/60 transition-colors cursor-pointer space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className={cn("border", meta.cls)}>{meta.label}</Badge>
                                        <span className="text-xs text-muted">{a.codigo}</span>
                                        {abriendo === a.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
                                    </div>
                                    <p className="font-semibold leading-snug">{a.titulo}</p>
                                    {a.resumen && <p className="text-xs text-muted line-clamp-2">{a.resumen}</p>}
                                    <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
                                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.vistas}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(a.updatedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                                        </span>
                                        {a.autor && <span className="truncate">{a.autor}</span>}
                                    </div>
                                </Card>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Modal: nuevo artículo */}
            {creando && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-2xl border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Nuevo artículo</h2>
                            <Button variant="ghost" size="icon" onClick={() => setCreando(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleCrear} className="space-y-3">
                            <Input
                                value={nuevo.titulo}
                                onChange={e => setNuevo(n => ({ ...n, titulo: e.target.value }))}
                                placeholder="Título (ej. Runbook: reiniciar el gateway)"
                            />
                            <div className="flex gap-2 flex-wrap">
                                <Select
                                    value={nuevo.categoria}
                                    onChange={e => setNuevo(n => ({ ...n, categoria: e.target.value as CategoriaArticulo }))}
                                    className="w-64"
                                >
                                    {CATEGORIAS.map(c => (
                                        <option key={c} value={c}>{categoriaArticuloMeta[c].label}</option>
                                    ))}
                                </Select>
                                <Input
                                    value={nuevo.etiquetas}
                                    onChange={e => setNuevo(n => ({ ...n, etiquetas: e.target.value }))}
                                    placeholder="Etiquetas separadas por coma"
                                    className="flex-1 min-w-40"
                                />
                            </div>
                            <Input
                                value={nuevo.resumen}
                                onChange={e => setNuevo(n => ({ ...n, resumen: e.target.value }))}
                                placeholder="Resumen corto para el listado (opcional)"
                            />
                            <Textarea
                                value={nuevo.contenido}
                                onChange={e => setNuevo(n => ({ ...n, contenido: e.target.value }))}
                                placeholder={"Contenido en Markdown...\n\n## Título\n- lista\n\n| Col A | Col B |\n|---|---|\n| a | b |"}
                                rows={12}
                                className="font-mono text-xs"
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" className="border-border" onClick={() => setCreando(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={guardando} className="gap-2">
                                    {guardando && <Loader2 className="h-4 w-4 animate-spin" />} Publicar
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
