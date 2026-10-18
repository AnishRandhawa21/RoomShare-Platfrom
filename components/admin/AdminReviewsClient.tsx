"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, CheckCircle, EyeOff, XCircle } from "lucide-react";
import { ReviewStatus } from "@/lib/enums";
import { updateAdminReviewStatusAction } from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: ReviewStatus;
  createdAt: Date | string;
  property: { id: string; name: string; slug: string; city: string };
  user: { id: string; email: string | null; profile: { fullName: string } | null };
}

interface AdminReviewsClientProps {
  initialReviews: ReviewRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialFilters: {
    status?: string;
  };
}

export function AdminReviewsClient({
  initialReviews,
  total,
  currentPage,
  totalPages,
  initialFilters,
}: AdminReviewsClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialFilters.status || "ALL");
  const [isProcessing, setIsProcessing] = useState(false);

  const applyFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "" || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    router.push(`/admin/reviews?${params.toString()}`);
  };

  const handleUpdateStatus = async (reviewId: string, newStatus: ReviewStatus) => {
    setIsProcessing(true);
    await updateAdminReviewStatusAction({
      reviewId,
      status: newStatus,
    });
    setIsProcessing(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Review Moderation</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit and moderate tenant reviews, star ratings, and property feedback.
          </p>
        </div>

        <div className="text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 px-3.5 py-1.5 rounded-full shadow-2xs">
          Total reviews: <strong className="text-zinc-900">{total}</strong>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs flex items-center gap-3 text-xs">
        <span className="text-zinc-500 font-medium">Status:</span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            applyFilters({ status: e.target.value, page: 1 });
          }}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
        >
          <option value="ALL">All Review Statuses</option>
          <option value="APPROVED">Approved (Visible)</option>
          <option value="PENDING">Pending Review</option>
          <option value="HIDDEN">Hidden / Flagged</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Rating & Feedback</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-medium">
                    No reviews found matching status.
                  </td>
                </tr>
              ) : (
                initialReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/property/${rev.property.slug}`}
                        target="_blank"
                        className="font-bold text-zinc-950 hover:text-violet-600 block line-clamp-1"
                      >
                        {rev.property.name}
                      </Link>
                      <span className="text-[11px] text-zinc-400">{rev.property.city}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-zinc-900">
                      {rev.user.profile?.fullName || rev.user.email}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1 mb-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                            }`}
                          />
                        ))}
                        <span className="text-[10px] font-bold text-zinc-700 ml-1">
                          {rev.rating}/5
                        </span>
                      </div>
                      <p className="text-zinc-700 line-clamp-2">{rev.comment}</p>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(rev.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          rev.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rev.status === "HIDDEN"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : rev.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {rev.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status !== "APPROVED" && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(rev.id, ReviewStatus.APPROVED)}
                            title="Approve Review"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        {rev.status !== "HIDDEN" && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(rev.id, ReviewStatus.HIDDEN)}
                            title="Hide Review"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        )}

                        {rev.status !== "REJECTED" && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(rev.id, ReviewStatus.REJECTED)}
                            title="Reject Review"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={15}
          onPageChange={(page) => applyFilters({ page })}
        />
      </div>
    </div>
  );
}
