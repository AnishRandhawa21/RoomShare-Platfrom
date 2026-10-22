import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/actions/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  ShieldCheck,
  LogOut,
  Home,
  Bookmark,
  Users,
  Shield,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
  UserCheck,
  MessageSquare,
  FileCheck2,
} from "lucide-react";

async function ProfileContent() {
  const user = await requireUser("/profile");
  const profile = user.profile;
  const owner = user.ownerProfile;
  const role = user.role;

  const isAdmin = role === "ADMIN";
  const isOwner = role === "OWNER";
  const isSeeker = !isAdmin && !isOwner;

  // Derive display initials
  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  // Role-specific stats querying
  let adminStats: { propertiesCount: number; usersCount: number; ownersCount: number; pendingCount: number } | null = null;
  let ownerStats: { totalProperties: number; publishedProperties: number; activePass: any | null } | null = null;
  let userStats: { savedCount: number; chatsCount: number; requestsCount: number } | null = null;

  if (isAdmin) {
    const [propertiesCount, usersCount, ownersCount, pendingCount] = await Promise.all([
      prisma.property.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.ownerProfile.count(),
      prisma.property.count({ where: { status: "PENDING_APPROVAL", deletedAt: null } }),
    ]);
    adminStats = { propertiesCount, usersCount, ownersCount, pendingCount };
  } else if (isOwner && owner) {
    const now = new Date();
    const nowMs = now.getTime();
    const [properties, activePass] = await Promise.all([
      prisma.property.findMany({
        where: { ownerId: owner.id, deletedAt: null },
        select: { id: true, status: true },
      }),
      prisma.ownerListingPass.findFirst({
        where: {
          ownerId: owner.id,
          status: "ACTIVE",
          expiresAt: { gte: now },
        },
        orderBy: { expiresAt: "desc" },
      }),
    ]);

    const totalProperties = properties.length;
    const publishedProperties = properties.filter((p) => p.status === "PUBLISHED").length;

    ownerStats = {
      totalProperties,
      publishedProperties,
      activePass: activePass
        ? {
            planType: activePass.planType,
            expiresAt: activePass.expiresAt,
            daysRemaining: Math.max(
              0,
              Math.ceil((activePass.expiresAt.getTime() - nowMs) / (1000 * 60 * 60 * 24))
            ),
          }
        : null,
    };
  } else {
    const [savedCount, chatsCount, requestsCount] = await Promise.all([
      prisma.savedProperty.count({ where: { userId: user.id } }),
      prisma.conversationParticipant.count({ where: { userId: user.id } }),
      prisma.roommateRequest.count({ where: { creatorId: user.id, status: "ACTIVE" } }),
    ]);
    userStats = { savedCount, chatsCount, requestsCount };
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E8EAE5] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-2xs border border-[#E8EAE5] transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="StayKro Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain p-0.5"
              />
            </div>
            <span className="text-lg font-black tracking-tight text-zinc-900 group-hover:text-[#00412E] transition-colors">
              StayKro<span className="text-[#96BF8A] font-black">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EAE5] bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-[#eff4ec] hover:text-[#00412E] transition-colors"
            >
              <Home className="h-3.5 w-3.5 text-[#00412E]" />
              <span>Explore PGs</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header Identity Card */}
          <div className="relative overflow-hidden rounded-3xl border border-[#E8EAE5] bg-white p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Identity Block */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                <div
                  className={`relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl text-white text-xl sm:text-2xl font-black shadow-sm ring-4 ${
                    isAdmin
                      ? "bg-gradient-to-br from-[#003626] to-[#00412E] ring-rose-100/60"
                      : isOwner
                      ? "bg-gradient-to-br from-[#00412E] to-[#125B44] ring-emerald-100/70"
                      : "bg-gradient-to-br from-[#00412E] to-[#96BF8A] ring-[#eff4ec]"
                  }`}
                >
                  {initials}
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-xs">
                    {isAdmin ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white">
                        <Shield className="h-3 w-3" />
                      </span>
                    ) : isOwner ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] text-white">
                        <Building2 className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00412E] text-[10px] text-white">
                        <UserCheck className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-950 truncate">
                      {profile?.fullName || (isOwner && owner?.businessName) || "Account Profile"}
                    </h1>

                    {/* Role Pill */}
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 border border-rose-200">
                        <Shield className="h-3 w-3" /> System Admin
                      </span>
                    )}
                    {isOwner && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-200">
                        <Building2 className="h-3 w-3" /> Partner Host
                      </span>
                    )}
                    {isSeeker && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 border border-zinc-200">
                        Resident Member
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 truncate font-medium">
                    {user.email}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1 font-semibold text-zinc-700 border border-zinc-200">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Active Account
                    </span>
                    {profile?.city && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1 font-semibold text-zinc-700 border border-zinc-200">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        {profile.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/invitations"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] hover:bg-[#002f21] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#96BF8A]" />
                      <span>Admin Control Panel</span>
                    </Link>
                    <Link
                      href="/owner/properties"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-700 transition-colors"
                    >
                      <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Owner Portal</span>
                    </Link>
                  </>
                )}

                {isOwner && (
                  <>
                    <Link
                      href="/owner/properties"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] hover:bg-[#002f21] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 text-[#96BF8A]" />
                      <span>Manage Properties</span>
                    </Link>
                    <Link
                      href="/owner/subscription"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-700 transition-colors"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-[#00412E]" />
                      <span>Listing Pass</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/saved"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-700 transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5 text-rose-500" />
                  <span>Saved</span>
                </Link>

                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-700 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Chats</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Role-Specific Metric Overview Strip */}
          {isAdmin && adminStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <Link
                href="/admin/properties"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Properties</span>
                  <Building2 className="h-4 w-4 text-zinc-400 group-hover:text-[#00412E]" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">{adminStats.propertiesCount}</div>
                <span className="text-[11px] text-zinc-500">PG accommodations</span>
              </Link>

              <Link
                href="/admin/invitations"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Hosts</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">{adminStats.ownersCount}</div>
                <span className="text-[11px] text-zinc-500">Verified owners</span>
              </Link>

              <div className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Users</span>
                  <Users className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">{adminStats.usersCount}</div>
                <span className="text-[11px] text-zinc-500">Platform members</span>
              </div>

              <Link
                href="/admin/pricing"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pricing</span>
                  <CreditCard className="h-4 w-4 text-[#00412E]" />
                </div>
                <div className="text-xl font-black text-[#00412E] mt-1 flex items-center gap-1">
                  <span>Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] text-zinc-500">Manage rates</span>
              </Link>
            </div>
          )}

          {isOwner && ownerStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Link
                href="/owner/properties"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Properties</span>
                  <Building2 className="h-4 w-4 text-zinc-400 group-hover:text-[#00412E]" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">
                  {ownerStats.publishedProperties}{" "}
                  <span className="text-xs font-normal text-zinc-400">/ {ownerStats.totalProperties} live</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <FileCheck2 className="h-3 w-3" /> Managed PGs
                </span>
              </Link>

              <Link
                href="/owner/subscription"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Listing Pass</span>
                  <CreditCard className="h-4 w-4 text-[#00412E]" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">
                  {ownerStats.activePass ? (
                    <span className="text-[#00412E]">StayKro {ownerStats.activePass.planType}</span>
                  ) : (
                    <span className="text-amber-600">No Active Pass</span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {ownerStats.activePass
                    ? `${ownerStats.activePass.daysRemaining} days remaining`
                    : "Renew for visibility"}
                </span>
              </Link>

              <Link
                href="/owner/enquiries"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Leads & Enquiries</span>
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1 flex items-center gap-1">
                  <span>Direct Leads</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-[#00412E]" />
                </div>
                <span className="text-[11px] text-zinc-500">Tenant WhatsApp & Calls</span>
              </Link>
            </div>
          )}

          {isSeeker && userStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Link
                href="/saved"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Saved PGs</span>
                  <Bookmark className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">{userStats.savedCount}</div>
                <span className="text-[11px] text-zinc-500">Shortlisted accommodations</span>
              </Link>

              <Link
                href="/chat"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Conversations</span>
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">{userStats.chatsCount}</div>
                <span className="text-[11px] text-zinc-500">Active owner & flatmate chats</span>
              </Link>

              <Link
                href="/roommates"
                className="rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-2xs hover:border-[#00412E] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Roommate Posts</span>
                  <Users className="h-4 w-4 text-[#00412E]" />
                </div>
                <div className="text-xl font-black text-zinc-950 mt-1">{userStats.requestsCount}</div>
                <span className="text-[11px] text-zinc-500">Active requests</span>
              </Link>
            </div>
          )}

          {/* Profile Form Card */}
          <div className="rounded-3xl border border-[#E8EAE5] bg-white p-6 sm:p-8 shadow-2xs">
            <div className="mb-6 pb-4 border-b border-zinc-100">
              <h2 className="text-lg font-black text-zinc-950">
                {isAdmin
                  ? "Administrator Credentials & Contact"
                  : isOwner
                  ? "Property Host & Business Profile"
                  : "Personal & Roommate Information"}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {isAdmin
                  ? "Update your primary administrator contact identity and operational details."
                  : isOwner
                  ? "Manage your primary host contact numbers, business group, and location for tenant leads."
                  : "Update your details and preferences to help PG owners and flatmates connect with you."}
              </p>
            </div>

            <ProfileForm user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center items-center py-20 px-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="h-32 bg-white rounded-3xl border border-zinc-200 animate-pulse" />
        <div className="h-96 bg-white rounded-3xl border border-zinc-200 animate-pulse" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
