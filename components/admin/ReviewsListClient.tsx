"use client";

import { useState } from "react";
import { toggleReviewApprovalAction, deleteReviewAction } from "@/app/actions/adminReviews";
import { CheckCircle2, XCircle, Trash2, Star, Sparkles, MessageSquare, AlertCircle } from "lucide-react";

interface ReviewsListClientProps {
  initialReviews: any[];
}

export default function ReviewsListClient({ initialReviews }: ReviewsListClientProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [error, setError] = useState("");

  const handleToggleApproval = async (id: string) => {
    try {
      const res = await toggleReviewApprovalAction(id);
      if (res.success) {
        setReviews(reviews.map(r => r.id === id ? { ...r, approved: res.approved } : r));
      } else {
        setError(res.error || "Failed to update review status.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await deleteReviewAction(id);
      if (res.success) {
        setReviews(reviews.filter(r => r.id !== id));
      } else {
        setError(res.error || "Failed to delete review.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === "PENDING") return !r.approved;
    if (filter === "APPROVED") return r.approved;
    return true;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < rating ? "text-[#C9A84C] fill-[#C9A84C]" : "text-neutral-700"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header and status counts */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-850">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Reviews Moderation <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          </h1>
          <p className="text-xs text-neutral-400">Moderating buyer testimonials and feedback cards.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex border border-neutral-850 rounded-lg bg-neutral-950 p-1">
          {(["ALL", "PENDING", "APPROVED"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === type
                  ? "bg-maroonClr text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Reviews list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReviews.length === 0 ? (
          <div className="col-span-full py-16 text-center text-neutral-600 font-medium">
            No testimonials match this filter.
          </div>
        ) : (
          filteredReviews.map((review) => {
            const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div 
                key={review.id}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-750 transition-all rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Author / Date / Target */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{review.author}</h4>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                        Target: {(review.productHandle || review.productId) === "global" ? "HOMEPAGE TESTIMONIAL" : `Product (${review.productHandle || review.productId})`}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-medium">{date}</span>
                  </div>

                  {/* Stars */}
                  {renderStars(review.rating)}

                  {/* Comment */}
                  <p className="text-xs text-neutral-300 italic leading-relaxed">
                    &quot;{review.comment}&quot;
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-neutral-850 flex justify-between items-center mt-2">
                  <button
                    onClick={() => handleToggleApproval(review.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      review.approved
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                    }`}
                  >
                    {review.approved ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Reject / Hide
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Live
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-xs text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
