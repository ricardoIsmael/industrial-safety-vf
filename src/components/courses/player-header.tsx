"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Menu, X } from "lucide-react";
import type { CourseData } from "@/types/course";

interface PlayerHeaderProps {
  course: CourseData;
  progressPct: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function PlayerHeader({ course, progressPct, sidebarOpen, onToggleSidebar }: PlayerHeaderProps) {
  return (
    <div className="h-14 bg-surface border-b border-border flex items-center px-4 justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Link
          href="/student/learning"
          className="flex items-center text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span className="text-sm font-medium hidden sm:inline">Volver</span>
        </Link>
        <div className="h-4 w-px bg-border hidden sm:block" />
        <h2 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">{course.title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Tu Progreso</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary">{progressPct}%</span>
            <div className="w-24 h-1.5 bg-surface-secondary rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
