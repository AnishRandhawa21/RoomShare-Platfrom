"use client";

import Link from "next/link";
import {
  Building2,
  BedDouble,
  CheckCircle2,
  Mail,
  Users,
  Plus,
  ArrowRight,
  MapPin,
  ExternalLink,
  Star,
} from "lucide-react";

interface PropertySummary {
  id: string;
  name: string;
  slug: string;
  locality: string;
  city: string;
  status: string;
  coverImage: string | null;
  roomTypesCount: number;
  totalBeds: number;
  availableBeds: number;
  pendingEnquiriesCount: number;
  activeRoommatesCount: number;
  averageRating?: number | null;
  reviewCount?: number;
}

interface RecentEnquiry {
  id: string;
  visitorName: string;
  visitorPhone: string;
  status: string;
  channel: string;
  createdAt: Date | string;
  property: { id: string; name: string; slug: string };
  roomType: { id: string; name: string } | null;
}

interface RecentReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  cleanliness: number | null;
  foodQuality: number | null;
  safety: number | null;
  createdAt: string;
  property: { id: string; name: string; slug: string };
  userName: string;
  userAvatar: string | null;
}

interface OwnerDashboardClientProps {
  metrics: {
    totalProperties: number;
    activeProperties: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    pendingEnquiriesCount: number;
    activeRoommateRequestsCount: number;
    averageRating?: number | null;
    totalReviews?: number;
    properties: PropertySummary[];
    recentEnquiries: RecentEnquiry[];
    recentReviews?: RecentReview[];
  };
}

export function OwnerDashboardClient({ metrics }: OwnerDashboardClientProps) {
  const statCards = [
    {
      label: "Total Properties",
      value: metrics.totalProperties,
      sublabel: `${metrics.activeProperties} published live`,
      icon: Building2,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      href: "/owner/properties",
    },
    {
      label: "Available Beds",
      value: metrics.availableBeds,
      sublabel: `${metrics.totalBeds} total bed capacity`,
      icon: BedDouble,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      href: "/owner/rooms",
    },
    {
      label: "Occupied Beds",
      value: metrics.occupiedBeds,
      sublabel:
        metrics.totalBeds > 0
          ? `${Math.round((metrics.occupiedBeds / metrics.totalBeds) * 100)}% occupancy rate`
          : "0% occupancy",
      icon: CheckCircle2,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      href: "/owner/rooms",
    },
    {
      label: "Resident Rating",
      value: metrics.averageRating ? `${metrics.averageRating} ★` : "New",
      sublabel: metrics.totalReviews && metrics.totalReviews > 0
        ? `${metrics.totalReviews} verified ${metrics.totalReviews === 1 ? "review" : "reviews"}`
        : "No ratings yet",
      icon: Star,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      href: "/owner/reviews",
    },
    {
      label: "Pending Enquiries",
      value: metrics.pendingEnquiriesCount,
      sublabel: "Awaiting your callback",
      icon: Mail,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      href: "/owner/enquiries",
    },
    {
      label: "Roommate Requests",
      value: metrics.activeRoommateRequestsCount,
      sublabel: "Active resident posts",
      icon: Users,
      color: "text-purple-600 bg-purple-50 border-purple-100",
      href: "/owner/roommate-requests",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Owner Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time occupancy metrics, resident ratings & reviews, enquiries, and inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/owner/onboarding"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Property</span>
          </Link>
          <Link
            href="/owner/reviews"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            <span>View Ratings</span>
          </Link>
          <Link
            href="/owner/rooms"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <BedDouble className="h-4 w-4 text-slate-500" />
            <span>Manage Rooms</span>
          </Link>
          <Link
            href="/owner/enquiries"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Mail className="h-4 w-4 text-slate-500" />
            <span>View Enquiries</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border ${card.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-2xl font-black tracking-tight text-slate-900">{card.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{card.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zero State Onboarding Prompt */}
      {metrics.totalProperties === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100 mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Let&apos;s get your first PG listed</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Add your property details, select locations from the master catalog, configure room sharing
            types, and start receiving verified resident leads.
          </p>
          <div className="mt-6">
            <Link
              href="/owner/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-transform active:scale-95"
            >
              <span>Create Property</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Properties Overview Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Properties</h2>
              <p className="text-xs text-slate-400">
                Compact view of bed occupancy and enquiry activity across your spaces.
              </p>
            </div>
            <Link
              href="/owner/properties"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All Properties</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {metrics.properties.map((prop) => {
              const isLive = prop.status === "PUBLISHED";
              return (
                <div
                  key={prop.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Cover photo or placeholder */}
                    <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                      {prop.coverImage ? (
                        <img
                          src={prop.coverImage}
                          alt={prop.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                          <Building2 className="h-10 w-10 stroke-1 text-slate-300" />
                        </div>
                      )}

                      <div className="absolute top-3 left-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isLive
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "bg-slate-900/80 text-white backdrop-blur-xs"
                          }`}
                        >
                          {prop.status}
                        </span>
                      </div>

                      {prop.pendingEnquiriesCount > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            {prop.pendingEnquiriesCount} new leads
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">{prop.name}</h3>
                          {prop.averageRating ? (
                            <Link
                              href={`/owner/properties/${prop.id}/reviews`}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors shrink-0"
                              title={`${prop.averageRating} out of 5 stars (${prop.reviewCount} reviews)`}
                            >
                              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                              <span>{prop.averageRating}</span>
                              <span className="text-[10px] text-amber-600 font-normal">({prop.reviewCount})</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/owner/properties/${prop.id}/reviews`}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
                              title="No ratings received yet"
                            >
                              <Star className="h-2.5 w-2.5 text-slate-400" />
                              <span>Unrated</span>
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {prop.locality}, {prop.city}
                          </span>
                        </p>
                      </div>

                      {/* Bed availability bar */}
                      <div className="rounded-xl bg-slate-50 p-2.5 space-y-1.5 border border-slate-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Live Bed Availability</span>
                          <span className="font-bold text-slate-900">
                            {prop.availableBeds} / {prop.totalBeds} Beds Free
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{
                              width: `${
                                prop.totalBeds > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        ((prop.totalBeds - prop.availableBeds) / prop.totalBeds) *
                                          100
                                      )
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{prop.roomTypesCount} Room Types</span>
                          <span>{prop.activeRoommatesCount} Roommate Posts</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="border-t border-slate-100 p-3 bg-slate-50/50 flex items-center justify-between gap-2">
                    <Link
                      href={`/owner/properties/${prop.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <span>Manage Property</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/owner/properties/${prop.id}/reviews`}
                        className="rounded-lg border border-slate-200 p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        title="View Resident Reviews & Ratings"
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                      </Link>
                      <Link
                        href={`/owner/properties/${prop.id}/rooms`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
                        title="Manage Room Inventory"
                      >
                        <BedDouble className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/property/${prop.slug}`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
                        title="Preview Public Listing"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Feeds: Recent Enquiries & Recent Resident Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <span>Recent Inbound Leads</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Prospective tenants requesting visits or callbacks.</p>
              </div>
              <Link
                href="/owner/enquiries"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View All
              </Link>
            </div>

            {metrics.recentEnquiries.length > 0 ? (
              <div className="divide-y divide-slate-100 mt-2">
                {metrics.recentEnquiries.map((enq) => {
                  const dateStr = new Date(enq.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div key={enq.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{enq.visitorName}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{enq.visitorPhone}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                            {enq.channel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Interested in <span className="font-semibold text-slate-700">{enq.property.name}</span>
                          {enq.roomType && ` • Unit: ${enq.roomType.name}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                        <Link
                          href="/owner/enquiries"
                          className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          Respond
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent enquiries received yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Resident Reviews & Feedback */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  <span>Recent Resident Ratings</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Verified resident star ratings and cleanliness feedback.</p>
              </div>
              <Link
                href="/owner/reviews"
                className="text-xs font-semibold text-amber-600 hover:text-amber-800"
              >
                View All
              </Link>
            </div>

            {metrics.recentReviews && metrics.recentReviews.length > 0 ? (
              <div className="divide-y divide-slate-100 mt-2">
                {metrics.recentReviews.map((rev) => {
                  const dateStr = new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  });
                  return (
                    <div key={rev.id} className="py-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{rev.userName}</span>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                            {rev.rating} / 5
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Property: <span className="font-semibold text-slate-700">{rev.property.name}</span>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-600 line-clamp-2 italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                        {rev.cleanliness && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                            Cleanliness: {rev.cleanliness}/5
                          </span>
                        )}
                        {rev.safety && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                            Security: {rev.safety}/5
                          </span>
                        )}
                        {rev.foodQuality && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                            Food: {rev.foodQuality}/5
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <p>No resident ratings received yet.</p>
                <p className="text-[11px] text-slate-400">
                  Residents can leave star ratings and reviews directly on your public property pages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
