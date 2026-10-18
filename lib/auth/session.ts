import { createClient } from "@/lib/supabase/server";
import { syncAppUser } from "./user";
import { redirect } from "next/navigation";

/**
 * Retrieves the currently authenticated application user with their profile.
 * Returns null if the user is not authenticated.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return null;
    }

    return await syncAppUser(supabaseUser);
  } catch (error: unknown) {
    // Preserve Next.js internal control flow errors (redirects, prerender suspension, hanging promise digest)
    if (
      error &&
      typeof error === "object" &&
      ("digest" in error || (error as Error).message?.includes("prerender"))
    ) {
      throw error;
    }
    console.error("Error retrieving current user:", error);
    return null;
  }
}

/**
 * Requires an authenticated user session on the server.
 * If not authenticated, redirects to /login with the returnUrl parameter.
 */
export async function requireUser(returnUrl?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const loginPath = returnUrl
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/login";
    redirect(loginPath);
  }

  return user;
}

/**
 * Requires an authenticated user with ADMIN role.
 * If not admin, redirects to /login.
 */
export async function requireAdmin(returnUrl?: string) {
  const user = await requireUser(returnUrl);

  if (user.role !== "ADMIN") {
    redirect("/login?error=admin_required");
  }

  return user;
}

/**
 * Requires an authenticated user with OWNER or ADMIN role.
 * Normal users without owner invites are redirected.
 */
export async function requireOwner(returnUrl?: string) {
  const user = await requireUser(returnUrl);

  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    redirect("/login?error=owner_required");
  }

  return user;
}
