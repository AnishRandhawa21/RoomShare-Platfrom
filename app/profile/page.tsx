import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/actions/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import Link from "next/link";
import { Building2, ShieldCheck, LogOut, Home, Bookmark, Users } from "lucide-react";

async function ProfileContent() {
  const user = await requireUser("/profile");
  const profile = user.profile;

  // Derive display initials
  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-100">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">
              StayKro<span className="text-indigo-600 font-black">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Home className="h-3.5 w-3.5 text-indigo-600" />
              <span>Explore PGs</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Profile Container */}
      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header Card */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white text-xl sm:text-2xl font-black shadow-md shadow-indigo-100 ring-4 ring-indigo-50">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950">
                      {profile?.fullName || "Your Profile"}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Active Member
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                    {user.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                      Role: {user.role}
                    </span>
                    {profile?.city && (
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                        {profile.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/saved"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-rose-600 transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5 text-rose-500" />
                  <span>Saved</span>
                </Link>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-indigo-600 transition-colors"
                >
                  <Users className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Chats</span>
                </Link>
                {(user.role === "OWNER" || user.role === "ADMIN") && (
                  <Link
                    href="/owner/properties"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Owner Portal</span>
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/invitations"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link
                  href="/"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Form Card */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-950">
                Personal & Roommate Information
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Update your details to help PG owners and flatmates connect with you.
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
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center py-20 px-4">
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
