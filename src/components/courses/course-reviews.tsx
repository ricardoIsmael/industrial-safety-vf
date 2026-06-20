"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Star, MoreVertical, ThumbsUp, ThumbsDown, Search, X } from "lucide-react";

// Reseña tal cual la entrega el backend (GET /api/v1/course/{id}/reviews)
interface ApiReview {
  id: string;
  author: string;
  authorAvatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Review {
  id: string;
  author: string;
  initial?: string;
  avatar?: string;
  rating: number;
  timeAgo: string;
  content: string;
}

interface CourseReviewsProps {
  courseRating: number;
  courseReviewCount: number;
  reviews: ApiReview[];
}

// Convierte un ISO date en un texto "Hace X ..." en español
function formatTimeAgo(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffDays = Math.floor((Date.now() - then) / 86_400_000);
  if (diffDays < 1) return "Hoy";
  if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `Hace ${months} mes${months > 1 ? "es" : ""}`;
  const years = Math.floor(months / 12);
  return `Hace ${years} año${years > 1 ? "s" : ""}`;
}

export function CourseReviews({ courseRating, courseReviewCount, reviews }: CourseReviewsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const formattedRating = courseRating.toString().replace(".", ",");

  // Reseñas reales del backend mapeadas al formato de la UI
  const allReviews: Review[] = reviews.map((r) => ({
    id: r.id,
    author: r.author,
    avatar: r.authorAvatarUrl ?? undefined,
    initial: (r.author?.trim()?.charAt(0) ?? "U").toUpperCase(),
    rating: r.rating,
    timeAgo: formatTimeAgo(r.createdAt),
    content: r.comment,
  }));

  // Para la grilla de la página, solo mostramos las primeras 4
  const visibleReviews = allReviews.slice(0, 4);

  // Filtro para la búsqueda en el modal
  const filteredReviews = allReviews.filter(
    (review) =>
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Distribución real de estrellas (para las barras del modal)
  const total = allReviews.length;
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = allReviews.filter((r) => r.rating === stars).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { stars, pct };
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 sm:h-4 sm:w-4 ${i < rating ? "text-amber-500 fill-current" : "text-slate-600"}`}
      />
    ));
  };

  const renderReviewItem = (review: Review, inModal: boolean = false) => (
    <div key={review.id} className={inModal ? "py-6 border-b border-slate-800 last:border-b-0" : ""}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {review.avatar ? (
              <Image src={review.avatar} alt={review.author} fill className="object-cover" />
            ) : (
              <span className="text-sm font-bold text-slate-300">{review.initial}</span>
            )}
          </div>
          <div>
            <div className="font-bold text-foreground">{review.author}</div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <div className="flex gap-0.5">
                {renderStars(review.rating)}
              </div>
              <span>{review.timeAgo}</span>
            </div>
          </div>
        </div>
        <MoreVertical className="h-5 w-5 text-slate-500 cursor-pointer hover:text-slate-300" />
      </div>
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {review.content}
      </p>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>¿Te ha resultado útil?</span>
        <button className="hover:text-white transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-800"><ThumbsUp className="h-4 w-4" /></button>
        <button className="hover:text-white transition-colors h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-800"><ThumbsDown className="h-4 w-4" /></button>
      </div>
    </div>
  );

  return (
    <>
      <div className="pt-8 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-8">
          <Star className="h-6 w-6 text-amber-500 fill-current" />
          <h2 className="text-2xl font-bold text-foreground">
            {formattedRating} valoración del curso • {courseReviewCount.toLocaleString()} valoraciones
          </h2>
        </div>

        {total > 0 ? (
          <>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              {visibleReviews.map((review) => renderReviewItem(review))}
            </div>

            <div className="mt-10">
              <Button
                variant="outline"
                className="border-slate-700 text-foreground hover:bg-slate-800 font-semibold px-6"
                onClick={() => setIsModalOpen(true)}
              >
                Mostrar todas las reseñas
              </Button>
            </div>
          </>
        ) : (
          <div className="text-slate-400 text-sm py-8 border border-dashed border-slate-700/50 rounded-xl text-center">
            Este curso aún no tiene reseñas. ¡Sé el primero en dejar una!
          </div>
        )}
      </div>

      {/* Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface rounded-xl border border-slate-700 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-amber-500 fill-current" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {formattedRating} valoración del curso • {courseReviewCount.toLocaleString()} valoraciones
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

              {/* Left Sidebar (Filters/Search) */}
              <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto">
                {/* Rating bars */}
                <div className="space-y-3 mb-8">
                  {distribution.map((row) => (
                    <div key={row.stars} className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full" style={{ width: `${row.pct}%` }} />
                      </div>
                      <div className="flex gap-0.5">
                        {renderStars(row.stars)}
                      </div>
                      <div className="w-8 text-xs text-amber-400 font-medium underline underline-offset-2 decoration-amber-500/30 text-right">
                        {`${row.pct}%`}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar reseñas"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-4 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Right Content (Scrollable Reviews) */}
              <div className="w-full md:w-2/3 p-6 overflow-y-auto">
                {filteredReviews.length > 0 ? (
                  <div className="flex flex-col">
                    {filteredReviews.map((review) => renderReviewItem(review, true))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No se encontraron reseñas que coincidan con tu búsqueda.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
