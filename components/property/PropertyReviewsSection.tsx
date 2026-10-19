"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  CheckCircle2,
  Sparkles,
  Utensils,
  Shield,
  Loader2,
  Send,
} from "lucide-react";
import { submitPropertyReviewAction } from "@/actions/review";

export interface PropertyReviewData {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  cleanliness: number | null;
  foodQuality: number | null;
  safety: number | null;
  createdAt: string | Date;
  user: {
    fullName: string;
    avatarUrl: string | null;
  };
}

interface PropertyReviewsSectionProps {
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  initialReviews: PropertyReviewData[];
  hasFood?: boolean;
  currentUser?: {
    id: string;
    email: string | null;
    profile?: { fullName: string; avatarUrl: string | null } | null;
  } | null;
}

export function PropertyReviewsSection({
  propertyId,
  propertyName,
  propertySlug,
  initialReviews,
  hasFood = false,
  currentUser,
}: PropertyReviewsSectionProps) {
  const [reviews, setReviews] = useState<PropertyReviewData[]>(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [foodQuality, setFoodQuality] = useState<number>(5);
  const [safety, setSafety] = useState<number>(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Calculate aggregates
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10
        ) / 10
      : null;

  const avgCleanliness =
    reviews.filter((r) => r.cleanliness).length > 0
      ? Math.round(
          (reviews.reduce((acc, r) => acc + (r.cleanliness || 0), 0) /
            reviews.filter((r) => r.cleanliness).length) *
            10
        ) / 10
      : null;

  const avgFood =
    reviews.filter((r) => r.foodQuality).length > 0
      ? Math.round(
          (reviews.reduce((acc, r) => acc + (r.foodQuality || 0), 0) /
            reviews.filter((r) => r.foodQuality).length) *
            10
        ) / 10
      : null;

  const avgSafety =
    reviews.filter((r) => r.safety).length > 0
      ? Math.round(
          (reviews.reduce((acc, r) => acc + (r.safety || 0), 0) /
            reviews.filter((r) => r.safety).length) *
            10
        ) / 10
      : null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!comment.trim() || comment.trim().length < 5) {
      setFeedbackMessage({
        type: "error",
        text: "Please write a review of at least 5 characters.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const res = await submitPropertyReviewAction({
        propertyId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        cleanliness,
        foodQuality: hasFood ? foodQuality : undefined,
        safety,
      });

      if (res.success && res.review) {
        setFeedbackMessage({
          type: "success",
          text: res.message || "Your review has been published!",
        });

        // Optimistically update reviews list
        const newReview: PropertyReviewData = {
          id: res.review.id,
          rating: res.review.rating,
          title: res.review.title,
          comment: res.review.comment,
          cleanliness: res.review.cleanliness,
          foodQuality: res.review.foodQuality,
          safety: res.review.safety,
          createdAt: res.review.createdAt,
          user: res.review.user,
        };

        setReviews((prev) => {
          const filtered = prev.filter((r) => r.id !== newReview.id);
          return [newReview, ...filtered];
        });

        // Reset form after short delay
        setTimeout(() => {
          setShowReviewForm(false);
          setTitle("");
          setComment("");
        }, 1200);
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.error || "Failed to submit review. Please try again.",
        });
      }
    } catch {
      setFeedbackMessage({
        type: "error",
        text: "An unexpected error occurred while saving your review.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="reviews-section" className="rounded-3xl border border-[#E8EAE5] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
      {/* 1. Header with Aggregate Stars & Write Review CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8EAE5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
              Ratings & Reviews
            </h2>
            {avgRating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-2.5 py-0.5 text-xs font-bold text-[#00412E]">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {avgRating.toFixed(1)} / 5.0
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Verified resident impressions and honest community feedback for {propertyName}.
          </p>
        </div>

        <div>
          {currentUser ? (
            <button
              type="button"
              onClick={() => {
                setShowReviewForm(!showReviewForm);
                setFeedbackMessage(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#002d20] transition-colors shadow-xs cursor-pointer"
            >
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              <span>{showReviewForm ? "Close Form" : "Rate this Property"}</span>
            </button>
          ) : (
            <Link
              href={`/login?returnUrl=/property/${propertySlug}#reviews-section`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#96BF8A] bg-[#eff4ec] px-4 py-2 text-xs font-bold text-[#00412E] hover:bg-[#96BF8A]/30 transition-colors shadow-2xs"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Log in to Rate</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Interactive Review & Rating Form */}
      {showReviewForm && currentUser && (
        <form
          onSubmit={handleSubmitReview}
          className="rounded-2xl border border-[#96BF8A]/40 bg-[#eff4ec]/40 p-5 sm:p-6 space-y-5 transition-all"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Rate your experience at {propertyName}
            </h3>
            <span className="text-[11px] font-semibold text-zinc-400">
              Posting as {currentUser.profile?.fullName || "Verified User"}
            </span>
          </div>

          {/* Interactive Star Rating Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Overall Rating: <span className="font-bold text-[#00412E]">{hoverRating || rating} out of 5 stars</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= (hoverRating || rating);
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-lg hover:bg-white transition-all cursor-pointer focus:outline-none"
                    aria-label={`Rate ${starValue} stars`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        isFilled
                          ? "fill-amber-400 text-amber-400 scale-105"
                          : "text-zinc-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Aspect Ratings (Cleanliness, Security, and optional Food Quality) */}
          <div className={`grid grid-cols-1 ${hasFood ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 pt-2`}>
            {/* Cleanliness */}
            <div className="rounded-xl bg-white p-3 border border-[#E8EAE5]">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="h-3 w-3 text-[#00412E]" /> Cleanliness & Hygiene
                </span>
                <span className="font-bold text-[#00412E]">{cleanliness}★</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCleanliness(val)}
                    className="cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        val <= cleanliness ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Safety & Security */}
            <div className="rounded-xl bg-white p-3 border border-[#E8EAE5]">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1">
                <span className="flex items-center gap-1 text-[11px]">
                  <Shield className="h-3 w-3 text-[#00412E]" /> Security & Safety
                </span>
                <span className="font-bold text-[#00412E]">{safety}★</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSafety(val)}
                    className="cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        val <= safety ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Food Quality (Only shown when property provides food) */}
            {hasFood && (
              <div className="rounded-xl bg-white p-3 border border-[#E8EAE5]">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Utensils className="h-3 w-3 text-[#00412E]" /> Food Quality
                  </span>
                  <span className="font-bold text-[#00412E]">{foodQuality}★</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFoodQuality(val)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          val <= foodQuality ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Headline / Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Great Wi-Fi and healthy food!"
              className="w-full rounded-xl border border-[#E8EAE5] bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#00412E] focus:outline-none"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Your Review & Experience *
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about room comfort, owner behavior, food quality, or maintenance..."
              className="w-full rounded-xl border border-[#E8EAE5] bg-white p-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#00412E] focus:outline-none"
              required
            />
          </div>

          {/* Feedback Alert */}
          {feedbackMessage && (
            <div
              className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                feedbackMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedbackMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : null}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="rounded-xl border border-[#E8EAE5] bg-white px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00412E] px-5 py-2 text-xs font-bold text-white hover:bg-[#002d20] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Rating</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 3. Aggregate Rating Breakdown Banner */}
      {avgRating ? (
        <div className="rounded-2xl bg-zinc-50/80 border border-[#E8EAE5] p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="text-center sm:border-r sm:border-zinc-200 sm:pr-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#00412E]">
              {avgRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-300"
                  }`}
                />
              ))}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-zinc-500">
              Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className={`sm:col-span-3 grid ${hasFood && avgFood ? "grid-cols-3" : "grid-cols-2"} gap-3 text-center sm:text-left`}>
            {avgCleanliness && (
              <div className="rounded-xl bg-white p-2.5 border border-[#E8EAE5]">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Cleanliness</div>
                <div className="text-sm font-bold text-zinc-900 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {avgCleanliness.toFixed(1)}
                </div>
              </div>
            )}
            {avgSafety && (
              <div className="rounded-xl bg-white p-2.5 border border-[#E8EAE5]">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Security</div>
                <div className="text-sm font-bold text-zinc-900 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {avgSafety.toFixed(1)}
                </div>
              </div>
            )}
            {hasFood && avgFood && (
              <div className="rounded-xl bg-white p-2.5 border border-[#E8EAE5]">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Food Quality</div>
                <div className="text-sm font-bold text-zinc-900 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {avgFood.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 4. List of Reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[#E8EAE5] bg-white p-4 sm:p-5 space-y-2.5 hover:border-[#96BF8A]/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-9 w-9 rounded-full bg-[#eff4ec] border border-[#96BF8A]/30 overflow-hidden flex items-center justify-center text-xs font-bold text-[#00412E]">
                    {r.user.avatarUrl ? (
                      <Image
                        src={r.user.avatarUrl}
                        alt={r.user.fullName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      r.user.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <span>{r.user.fullName}</span>
                      <span className="inline-flex items-center text-[10px] font-semibold text-[#00412E] bg-[#eff4ec] px-1.5 py-0.2 rounded-full">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 text-[#96BF8A]" /> Resident
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                {/* Star Score */}
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-xs font-bold text-amber-900">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{r.rating}.0</span>
                </div>
              </div>

              {/* Title & Comment */}
              {r.title && (
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                  {r.title}
                </h4>
              )}
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {r.comment}
              </p>

              {/* Sub-aspect Badges */}
              {(r.cleanliness || (hasFood && r.foodQuality) || r.safety) && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-100 text-[10px] text-zinc-500 font-medium">
                  {r.cleanliness && (
                    <span>Cleanliness: <strong className="text-zinc-800">{r.cleanliness}/5</strong></span>
                  )}
                  {r.safety && (
                    <span>• Security: <strong className="text-zinc-800">{r.safety}/5</strong></span>
                  )}
                  {hasFood && r.foodQuality && (
                    <span>• Food: <strong className="text-zinc-800">{r.foodQuality}/5</strong></span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E8EAE5] p-8 text-center bg-zinc-50/50">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff4ec] text-[#00412E] mb-2">
            <Star className="h-5 w-5 text-[#00412E]" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-900">No reviews yet</h4>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            Be the first resident to rate {propertyName} and help students and professionals find quality living!
          </p>
        </div>
      )}
    </div>
  );
}
