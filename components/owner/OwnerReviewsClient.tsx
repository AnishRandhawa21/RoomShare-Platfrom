"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PropertySubNav } from "./PropertySubNav";
import {
  Star,
  Search,
  ExternalLink,
  Building2,
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Utensils,
  Flag,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { reportOwnerReviewAction } from "@/actions/owner";

export interface ReviewItem {
  id: string;
  propertyId: string;
  rating: number;
  title: string | null;
  comment: string;
  cleanliness: number | null;
  foodQuality: number | null;
  safety: number | null;
  createdAt: string;
  property: {
    id: string;
    name: string;
    slug: string;
    locality?: string;
    city?: string;
  };
  user: {
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number | null;
  avgCleanliness: number | null;
  avgSafety: number | null;
  avgFood: number | null;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface OwnerReviewsClientProps {
  initialReviews: ReviewItem[];
  stats: ReviewStats;
  propertiesList?: Array<{ id: string; name: string; slug: string }>;
  propertyContext?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

export function OwnerReviewsClient({
  initialReviews,
  stats,
  propertiesList = [],
  propertyContext,
}: OwnerReviewsClientProps) {
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    propertyContext ? propertyContext.id : "ALL"
  );
  const [selectedRating, setSelectedRating] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Report Modal State
  const [reportingReview, setReportingReview] = useState<ReviewItem | null>(null);
  const [reportReason, setReportReason] = useState<
    "ABUSIVE_LANGUAGE" | "FALSE_REVIEW" | "HARASSMENT" | "SPAM" | "OTHER"
  >("ABUSIVE_LANGUAGE");
  const [reportNotes, setReportNotes] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [reportErrorMsg, setReportErrorMsg] = useState<string | null>(null);

  const handleOpenReport = (review: ReviewItem) => {
    setReportingReview(review);
    setReportReason("ABUSIVE_LANGUAGE");
    setReportNotes("");
    setReportErrorMsg(null);
  };

  const handleCloseReport = () => {
    if (isSubmittingReport) return;
    setReportingReview(null);
    setReportErrorMsg(null);
  };

  const handleSubmitReport = async () => {
    if (!reportingReview) return;
    setIsSubmittingReport(true);
    setReportErrorMsg(null);

    const res = await reportOwnerReviewAction({
      reviewId: reportingReview.id,
      reason: reportReason,
      notes: reportNotes,
    });

    setIsSubmittingReport(false);

    if (res.success) {
      setReportedIds((prev) => new Set([...prev, reportingReview.id]));
      setReportSuccessMsg(res.message || "Review reported and quarantined for administrator moderation.");
      setReportingReview(null);
      // Auto-hide success alert after 6 seconds
      setTimeout(() => setReportSuccessMsg(null), 6000);
    } else {
      setReportErrorMsg(res.error || "Failed to report review.");
    }
  };

  const filteredReviews = useMemo(() => {
    return initialReviews.filter((review) => {
      // Property filter
      if (selectedPropertyId !== "ALL" && review.propertyId !== selectedPropertyId) {
        return false;
      }
      // Star rating filter
      if (selectedRating !== "ALL" && review.rating !== selectedRating) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = review.user.fullName.toLowerCase().includes(query);
        const matchesComment = review.comment.toLowerCase().includes(query);
        const matchesTitle = review.title?.toLowerCase().includes(query);
        const matchesProp = review.property.name.toLowerCase().includes(query);
        if (!matchesName && !matchesComment && !matchesTitle && !matchesProp) {
          return false;
        }
      }
      return true;
    });
  }, [initialReviews, selectedPropertyId, selectedRating, searchQuery]);

  return (
    <div className="space-y-6">
      {/* If propertyContext is provided, display PropertySubNav */}
      {propertyContext && (
        <PropertySubNav
          propertyId={propertyContext.id}
          propertySlug={propertyContext.slug}
          propertyName={propertyContext.name}
          status={propertyContext.status}
        />
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Star className="h-7 w-7 fill-amber-400 text-amber-500" />
            <span>
              {propertyContext ? `${propertyContext.name} — Ratings & Reviews` : "Resident Ratings & Reviews"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {propertyContext
              ? "Read direct feedback, cleanliness evaluations, and security scores from verified residents."
              : "Monitor verified feedback, ratings trends, and resident satisfaction across all your PG properties."}
          </p>
        </div>

        {propertyContext && (
          <Link
            href={`/property/${propertyContext.slug}#reviews`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <span>Preview on Public Listing</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        )}
      </div>

      {/* Success Notification Banner */}
      {reportSuccessMsg && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{reportSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setReportSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* High-Level Scorecard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Star Card */}
        <div className="md:col-span-1 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Overall Rating
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                {stats.averageRating ? stats.averageRating : "—"}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      stats.averageRating && star <= Math.round(stats.averageRating)
                        ? "fill-amber-400 text-amber-500"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.totalReviews > 0
                ? `Based on ${stats.totalReviews} verified ${
                    stats.totalReviews === 1 ? "resident review" : "resident reviews"
                  }`
                : "No verified reviews yet"}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>100% Verified Resident Reviews</span>
          </div>
        </div>

        {/* Aspect Scores */}
        <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Cleanliness</span>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {stats.avgCleanliness ? `${stats.avgCleanliness} / 5` : "—"}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Hygiene & maintenance</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Security & Safety</span>
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {stats.avgSafety ? `${stats.avgSafety} / 5` : "—"}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">CCTV, entry & gate curfew</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Food Quality</span>
              <Utensils className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900">
                {stats.avgFood ? `${stats.avgFood} / 5` : "N/A"}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Meal taste & freshness</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution Bars */}
      {stats.totalReviews > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Rating Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count =
                stats.ratingDistribution[starNum as keyof typeof stats.ratingDistribution] || 0;
              const percent = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <button
                  key={starNum}
                  type="button"
                  onClick={() =>
                    setSelectedRating((prev) => (prev === starNum ? "ALL" : (starNum as any)))
                  }
                  className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    selectedRating === starNum
                      ? "border-amber-400 bg-amber-50/80 shadow-xs ring-1 ring-amber-400"
                      : "border-slate-100 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <span>{starNum}</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-900">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{percent}% of reviews</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Dropdown (if viewing global reviews) */}
          {!propertyContext && propertiesList.length > 0 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Properties ({propertiesList.length})</option>
              {propertiesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Rating Filter Dropdown */}
          <select
            value={selectedRating}
            onChange={(e) =>
              setSelectedRating(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Stars</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>

          {(selectedPropertyId !== (propertyContext ? propertyContext.id : "ALL") ||
            selectedRating !== "ALL" ||
            searchQuery.trim().length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSelectedPropertyId(propertyContext ? propertyContext.id : "ALL");
                setSelectedRating("ALL");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline px-1"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews & names..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>
              Showing {filteredReviews.length} {filteredReviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => {
              const dateStr = new Date(rev.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              return (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header: User Info & Star Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {rev.user.avatarUrl ? (
                          <img
                            src={rev.user.avatarUrl}
                            alt={rev.user.fullName}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs">
                            {rev.user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">
                              {rev.user.fullName}
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-100">
                              Verified
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/90 px-2.5 py-1 text-xs font-bold text-amber-900">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span>{rev.rating} / 5</span>
                      </div>
                    </div>

                    {/* Property Link (if global view) */}
                    {!propertyContext && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <Link
                          href={`/owner/properties/${rev.property.id}/reviews`}
                          className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                          {rev.property.name}
                        </Link>
                        {rev.property.locality && (
                          <span className="text-slate-400">({rev.property.locality})</span>
                        )}
                      </div>
                    )}

                    {/* Review Title & Content */}
                    <div>
                      {rev.title && (
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{rev.title}</h4>
                      )}
                      <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Sub-ratings Breakdown & Report Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                    <div className="flex flex-wrap gap-2">
                      {rev.cleanliness && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-100">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          <span>Cleanliness: {rev.cleanliness}/5</span>
                        </span>
                      )}
                      {rev.safety && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-800 border border-blue-100">
                          <ShieldCheck className="h-3 w-3 text-blue-600" />
                          <span>Security: {rev.safety}/5</span>
                        </span>
                      )}
                      {rev.foodQuality && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-800 border border-amber-100">
                          <Utensils className="h-3 w-3 text-amber-600" />
                          <span>Food: {rev.foodQuality}/5</span>
                        </span>
                      )}
                    </div>

                    {reportedIds.has(rev.id) ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                        <span>Under Moderation (Hidden)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenReport(rev)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors ml-auto cursor-pointer"
                        title="Report abusive language, harassment, or fake review"
                      >
                        <Flag className="h-3 w-3" />
                        <span>Report Abuse</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-4 border border-amber-100">
            <Star className="h-7 w-7 fill-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery || selectedRating !== "ALL" || selectedPropertyId !== "ALL"
              ? "No reviews match your filters"
              : "No resident ratings or reviews yet"}
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {searchQuery || selectedRating !== "ALL" || selectedPropertyId !== "ALL"
              ? "Try resetting your search query or selecting 'All Stars' to see all property feedback."
              : "When seekers or current residents rate and review your property on StayKro, their feedback and ratings breakdown will appear here in real-time."}
          </p>
          {(searchQuery || selectedRating !== "ALL" || selectedPropertyId !== "ALL") && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setSelectedPropertyId(propertyContext ? propertyContext.id : "ALL");
                  setSelectedRating("ALL");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Report Review Modal */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-rose-600" />
                  <span>Report Inappropriate Review</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Report abusive remarks, harassment, defamation, or fake reviews for moderation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReport}
                disabled={isSubmittingReport}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Review Preview */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>By: {reportingReview.user.fullName}</span>
                <span className="text-amber-700 font-bold">★ {reportingReview.rating} / 5</span>
              </div>
              {reportingReview.title && <p className="font-medium text-slate-700">{reportingReview.title}</p>}
              <p className="text-slate-600 italic line-clamp-3">&ldquo;{reportingReview.comment}&rdquo;</p>
            </div>

            {/* Error Message */}
            {reportErrorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{reportErrorMsg}</span>
              </div>
            )}

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason for Reporting</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="ABUSIVE_LANGUAGE">Abusive, vulgar, or offensive language</option>
                <option value="FALSE_REVIEW">Fake review (Person never stayed at this property)</option>
                <option value="HARASSMENT">Personal attack, threat, or harassment</option>
                <option value="SPAM">Spam, advertising, or unauthorized commercial link</option>
                <option value="OTHER">Other violation of community guidelines</option>
              </select>
            </div>

            {/* Detailed Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Additional Context (Optional)</label>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                rows={3}
                placeholder="Explain why this review violates community standards or contains false claims..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-3 text-[11px] text-amber-900 leading-relaxed">
              <strong>What happens next?</strong> Reporting will immediately quarantine this review from public view and notify the StayKro Trust &amp; Safety team for formal review.
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseReport}
                disabled={isSubmittingReport}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <Flag className="h-3.5 w-3.5" />
                    <span>Confirm &amp; Hide Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
