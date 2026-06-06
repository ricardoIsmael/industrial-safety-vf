"use client";
import { Button } from "@/components/ui/button";
import {
  X, CheckCircle2, Circle, FileText,
  PlayCircle, Award, ClipboardList,
} from "lucide-react";
import type { CourseData, Lecture } from "@/types/course";

interface CourseSidebarProps {
  course: CourseData;
  completedIds: Set<string>;
  activeLecture: Lecture | null;
  onSelectLecture: (lecture: Lecture) => void;
  sidebarOpen: boolean;
  onClose: () => void;
  hasExam: boolean;
  progressPct: number;
  onOpenExam: () => void;
}

export function CourseSidebar({
  course, completedIds, activeLecture, onSelectLecture,
  sidebarOpen, onClose, hasExam, progressPct, onOpenExam,
}: CourseSidebarProps) {
  return (
    <div className={`
      absolute lg:relative right-0 top-0 bottom-0 z-20
      w-80 bg-surface border-l border-border flex flex-col shrink-0
      transition-transform duration-300 ease-in-out
      ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
    `}>
      <div className="p-4 border-b border-border flex justify-between items-center bg-surface-secondary/30">
        <h3 className="font-bold">Contenido del Curso</h3>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {course.sectionList.map((sec, sIdx) => (
          <div key={sec.id} className="border-b border-border">
            <div className="p-4 bg-surface-secondary/20 sticky top-0 backdrop-blur-sm z-10">
              <h4 className="text-sm font-bold">Módulo {sIdx + 1}: {sec.title}</h4>
            </div>
            <div className="flex flex-col">
              {sec.lectureList.map(lec => {
                const done = completedIds.has(lec.id);
                const active = activeLecture?.id === lec.id;
                const isExam = lec.lectureType === "EXAM";
                return (
                  <button
                    key={lec.id}
                    onClick={() => { onSelectLecture(lec); onClose(); }}
                    className={`p-3 pl-5 flex gap-3 transition-colors text-left group ${
                      active ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-surface-secondary"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : isExam ? (
                        <FileText className={`h-4 w-4 ${active ? "text-primary" : "text-muted group-hover:text-foreground"}`} />
                      ) : (
                        <Circle className={`h-4 w-4 ${active ? "text-primary" : "text-muted group-hover:text-foreground"}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${active ? "font-semibold text-primary" : "text-foreground/80 group-hover:text-foreground"}`}>
                        {lec.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                        {isExam ? <Award className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                        {lec.duration}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hasExam && (
        <div className="p-3 border-t border-border">
          <button
            onClick={progressPct === 100 ? onOpenExam : undefined}
            disabled={progressPct < 100}
            className={`w-full p-3 pl-4 flex gap-3 rounded-xl text-left transition-colors ${
              progressPct === 100
                ? "bg-warning/10 hover:bg-warning/20 border border-warning/30"
                : "bg-surface-secondary/20 border border-border/30 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <ClipboardList className={`h-4 w-4 ${progressPct === 100 ? "text-warning" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${progressPct === 100 ? "text-warning" : "text-muted-foreground"}`}>
                Examen Final
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {progressPct === 100 ? "¡Disponible! Click para rendir" : `Completa el curso (${progressPct}%)`}
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
