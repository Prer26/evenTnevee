import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function ReviewModal({ booking, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      await base44.reviews.create({
        booking_id: booking.id,
        rating,
        comment: comment.trim(),
      });
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't submit review",
        description: err.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[24px] border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-espresso">Rate & Review</h3>
            <p className="text-xs text-taupe">{booking.vendor_name} &bull; {booking.event_type}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-taupe hover:bg-beige hover:text-espresso transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-taupe mb-2">
              Overall Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        active
                          ? "fill-champagne text-champagne drop-shadow-sm"
                          : "text-taupe/30 hover:text-taupe"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-3 font-display text-sm font-semibold text-espresso">
                {hoverRating || rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-taupe mb-2">
              Your Review & Comments
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience working with this vendor..."
              className="w-full rounded-2xl border border-border bg-cream/40 p-3 text-sm text-espresso placeholder:text-taupe/60 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border bg-card py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
