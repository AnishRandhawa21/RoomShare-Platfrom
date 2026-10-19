"use server";

import { createClient } from "@/lib/supabase/server";
import { syncAppUser } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { rateLimiters } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export type AuthActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Handles user sign-up via Supabase Auth and creates corresponding Prisma User/Profile.
 */
export async function signUpAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const rawFullName = formData.get("fullName")?.toString().trim();
  const rawPhone = formData.get("phone")?.toString().trim();
  const inviteToken = formData.get("inviteToken")?.toString().trim();
  const returnUrl = formData.get("returnUrl")?.toString() || (inviteToken ? `/owner/invite/${inviteToken}` : "/");
  const phone = rawPhone && rawPhone.length > 0 ? rawPhone : undefined;

  if (!email || !password || !rawFullName) {
    return { success: false, error: "Please provide your full name, email, and password." };
  }

  // Rate Limiting (5 signup/auth attempts per 15 mins)
  const rateLimit = rateLimiters.auth(email);
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many sign-up attempts from this connection. Please wait 15 minutes before trying again.",
    };
  }

  const fullName = sanitizeText(rawFullName, 80);

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { success: false, error: "Passwords do not match. Please verify both passwords." };
  }

  // Pre-check phone uniqueness if provided
  if (phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return {
        success: false,
        error: "This phone number is already registered. Please use another number or log in.",
      };
    }
  }

  // Pre-check email uniqueness in Prisma
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    return {
      success: false,
      error: "An account with this email already exists. Please sign in instead.",
    };
  }

  try {
    const headerList = await headers();
    const origin = headerList.get("origin") || "";
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          phone,
        },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Sync into Prisma database immediately - normal signup strictly creates USER role
      await syncAppUser(data.user, { fullName, phone });
    }

    // If email confirmation is required by Supabase project settings
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        error: "An account with this email already exists. Please log in instead.",
      };
    }

    if (data.session) {
      // Auto-confirmed or session active
      revalidatePath("/", "layout");
      redirect(returnUrl);
    }

    return {
      success: true,
      message: "Registration successful! Please check your email to confirm your account.",
    };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err) {
      // Next.js redirect throw, re-throw to allow redirection
      throw err;
    }
    const message = err instanceof Error ? err.message : "An unexpected error occurred during sign-up.";
    console.error("Sign up action error:", err);
    return { success: false, error: message };
  }
}

/**
 * Handles user login via email or mobile number and password.
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const identifier = (
    formData.get("email") ||
    formData.get("emailOrPhone") ||
    ""
  ).toString().trim();
  const password = formData.get("password")?.toString();
  const inviteToken = formData.get("inviteToken")?.toString().trim();
  const returnUrl = formData.get("returnUrl")?.toString() || (inviteToken ? `/owner/invite/${inviteToken}` : "/");

  if (!identifier || !password) {
    return { success: false, error: "Please enter your email/phone and password." };
  }

  // Rate Limiting (5 login attempts per 15 minutes per identifier to prevent brute forcing)
  const rateLimit = rateLimiters.auth(identifier);
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many failed login attempts. For security reasons, please wait 15 minutes before trying again.",
    };
  }

  let resolvedEmail = identifier;

  // If user entered a phone number instead of an email
  if (!identifier.includes("@")) {
    const cleanDigits = identifier.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number or email address." };
    }

    const last10 = cleanDigits.slice(-10);
    const candidateVariants = [
      last10,
      `+91${last10}`,
      `91${last10}`,
      `0${last10}`,
    ];

    const matchedUser = await prisma.user.findFirst({
      where: {
        phone: { in: candidateVariants },
      },
      select: { email: true },
    });

    if (matchedUser?.email) {
      resolvedEmail = matchedUser.email;
    } else {
      return {
        success: false,
        error: "No account found associated with this mobile number. Please check your number or sign up.",
      };
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("invalid credentials")
      ) {
        return {
          success: false,
          error: "Incorrect email/phone or password. Please check and try again.",
        };
      }
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return {
          success: false,
          error: "Your email address is not yet confirmed. Please verify your email before logging in.",
        };
      }
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Ensure user is synced with Prisma DB
      await syncAppUser(data.user);
    }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err) {
      // Next.js redirect throw, re-throw to allow redirection
      throw err;
    }
    const message = err instanceof Error ? err.message : "Failed to sign in. Please try again.";
    console.error("Login action error:", err);
    return { success: false, error: message };
  }

  // Invalidate router cache and re-evaluate layout/pages with fresh session
  revalidatePath("/", "layout");
  redirect(returnUrl);
}

/**
 * Signs the user out from Supabase and redirects to login.
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Sends a password reset email link.
 */
export async function forgotPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim();

  if (!email) {
    return { success: false, error: "Please enter your email address." };
  }

  try {
    const headerList = await headers();
    const origin = headerList.get("origin") || "";
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not send reset link. Please try again.";
    console.error("Forgot password error:", err);
    return { success: false, error: message };
  }
}

/**
 * Updates the user's password once verified via reset link.
 */
export async function resetPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || !confirmPassword) {
    return { success: false, error: "Please fill in all password fields." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Password updated successfully! You can now log in with your new password.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update password.";
    console.error("Reset password error:", err);
    return { success: false, error: message };
  }
}

/**
 * Retrieves the currently active user session for client components and self-healing headers.
 */
export async function getAuthSessionAction() {
  try {
    const { getCurrentUser } = await import("@/lib/auth/session");
    const user = await getCurrentUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile
        ? {
            fullName: user.profile.fullName,
            avatarUrl: user.profile.avatarUrl,
          }
        : null,
    };
  } catch (err) {
    console.error("Error retrieving auth session action:", err);
    return null;
  }
}

/**
 * Returns discovery cities for client navigation and self-healing headers.
 */
export async function getDiscoveryCitiesAction() {
  try {
    const { getDiscoveryLocations } = await import("@/lib/discovery");
    const { cities } = await getDiscoveryLocations();
    return cities.map((c) => c.name);
  } catch (err) {
    console.error("Error retrieving discovery cities action:", err);
    return [];
  }
}

