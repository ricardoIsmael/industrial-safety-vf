import { useState } from "react";
import type { CourseData } from "@/types/course";

export function useCourseProgress(uid: string, cursoId: string) {
  const progressKey = `completed_${uid}_${cursoId}`;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const loadProgress = () => {
    const saved = JSON.parse(localStorage.getItem(progressKey) ?? "[]") as string[];
    setCompletedIds(new Set(saved));
  };

  const markCompleted = (lectureId: string, course: CourseData | null) => {
    const updated = new Set(completedIds);
    updated.add(lectureId);
    setCompletedIds(updated);
    localStorage.setItem(progressKey, JSON.stringify(Array.from(updated)));
    if (course) {
      const total = course.sectionList
        .flatMap(s => s.lectureList)
        .filter(l => l.lectureType !== "EXAM").length;
      const pct = total > 0 ? Math.round((updated.size / total) * 100) : 0;
      localStorage.setItem(`progress_${uid}_${cursoId}`, String(pct));
    }
  };

  return { completedIds, loadProgress, markCompleted };
}
