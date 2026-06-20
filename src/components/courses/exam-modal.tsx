"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ClipboardList, Trophy, XCircle, Download, Award } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { ExamData, ExamResult, ExamQuestion } from "@/types/course";

interface ExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
  courseTitle: string;
}

export function ExamModal({ open, onOpenChange, cursoId, courseTitle }: ExamModalProps) {
  const { data: session } = useSession();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examStep, setExamStep] = useState<"taking" | "result">("taking");
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = async (nextOpen: boolean) => {
    if (nextOpen && !examData) {
      setLoading(true);
      try {
        const res = await fetch(`/api/proxy/exams/by-course/${cursoId}`);
        if (!res.ok) { toast.error("No se pudo cargar el examen"); return; }
        setExamData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    if (nextOpen) {
      setExamAnswers({});
      setExamStep("taking");
      setExamResult(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!examData || !session) return;
    const unanswered = examData.questions.filter(q => !examAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Faltan ${unanswered.length} pregunta(s) por responder`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proxy/exams/${examData.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: (session as any)?.keycloakId ?? "",
          studentName: session.user?.name ?? "",
          studentEmail: session.user?.email ?? "",
          answers: examAnswers,
        }),
      });
      if (!res.ok) { toast.error("Error al enviar el examen"); return; }
      setExamResult(await res.json());
      setExamStep("result");
    } catch {
      toast.error("Error al enviar el examen");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0F172A] border-border/40 text-foreground max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b border-border/20 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <ClipboardList className="h-5 w-5 text-warning" />
            Examen Final — {courseTitle}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && examStep === "taking" && examData && (
          <>
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Object.keys(examAnswers).length} de {examData.questions.length} respondidas</span>
                <span>Score mínimo: <span className="text-warning font-bold">{examData.passingScore}%</span></span>
              </div>
              {examData.questions.map((q: ExamQuestion, idx: number) => (
                <div key={q.id} className={`rounded-xl border p-5 transition-colors ${
                  examAnswers[q.id] ? "border-warning/30 bg-warning/5" : "border-border/40 bg-surface-secondary/10"
                }`}>
                  <p className="text-sm font-bold mb-4">
                    <span className="text-warning mr-2">{idx + 1}.</span>{q.text}
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "A", value: q.optionA },
                      { label: "B", value: q.optionB },
                      { label: "C", value: q.optionC },
                      { label: "D", value: q.optionD },
                    ].map(opt => (
                      <label key={opt.label} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                        examAnswers[q.id] === opt.label
                          ? "bg-warning/15 border-warning/50"
                          : "bg-surface-secondary/20 border-transparent hover:border-border/60"
                      }`}>
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt.label}
                          checked={examAnswers[q.id] === opt.label}
                          onChange={() => setExamAnswers(prev => ({ ...prev, [q.id]: opt.label }))}
                          className="accent-warning"
                        />
                        <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{opt.label}.</span>
                        <span className="text-sm">{opt.value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border/20 shrink-0 flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                {Object.keys(examAnswers).length < examData.questions.length
                  ? "Responde todas las preguntas para enviar"
                  : "¡Todas respondidas!"}
              </p>
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(examAnswers).length < examData.questions.length || submitting}
                className="bg-warning hover:bg-warning/90 text-warning-foreground font-bold gap-2 px-8"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Enviando..." : "Enviar Examen"}
              </Button>
            </div>
          </>
        )}

        {examStep === "result" && examResult && (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center gap-6">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
              examResult.passed ? "bg-green-500/20" : "bg-destructive/20"
            }`}>
              {examResult.passed
                ? <Trophy className="h-12 w-12 text-green-500" />
                : <XCircle className="h-12 w-12 text-destructive" />}
            </div>
            <div>
              <p className="text-4xl font-black mb-1">{examResult.score}%</p>
              <p className={`text-lg font-bold ${examResult.passed ? "text-green-500" : "text-destructive"}`}>
                {examResult.passed ? "¡Aprobado!" : "No aprobado"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {examResult.passed
                  ? "Felicidades, obtuviste tu certificado de finalización."
                  : `Necesitabas ${examData?.passingScore ?? 70}% para aprobar. ¡Inténtalo de nuevo!`}
              </p>
            </div>
            {examResult.passed && examResult.certificateUrl && (
              <a href={examResult.certificateUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 px-8">
                  <Download className="h-4 w-4" /> Descargar Certificado
                </Button>
              </a>
            )}
            {!examResult.passed && (
              <Button variant="outline" className="border-border/40 gap-2" onClick={() => {
                setExamAnswers({});
                setExamStep("taking");
                setExamResult(null);
              }}>
                <ClipboardList className="h-4 w-4" /> Reintentar Examen
              </Button>
            )}
            <Button variant="ghost" className="text-muted-foreground text-xs" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
