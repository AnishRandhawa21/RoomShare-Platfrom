import { prisma } from "@/lib/prisma";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

export interface SyncProfileData {
  fullName?: string;
  phone?: string;
}

/**
 * Synchronizes a Supabase Auth user into the application's Prisma database.
 * Ensures every authenticated Supabase user has a corresponding User and Profile record.
 */
export async function syncAppUser(
  supabaseUser: SupabaseAuthUser,
  initialData?: SyncProfileData
) {
  try {
    // 1. Check if user already exists by Supabase Auth ID
    const existingUserByAuthId = await prisma.user.findUnique({
      where: { supabaseAuthId: supabaseUser.id },
      include: {
        profile: true,
        ownerProfile: true,
      },
    });

    if (existingUserByAuthId) {
      // If user exists, check if email/phone needs updating
      const updateData: { email?: string; phone?: string | null } = {};

      if (supabaseUser.email && existingUserByAuthId.email !== supabaseUser.email) {
        updateData.email = supabaseUser.email;
      }

      // Check phone update safely
      const candidatePhone = supabaseUser.phone?.trim() || null;
      if (candidatePhone && candidatePhone !== existingUserByAuthId.phone) {
        const phoneConflict = await prisma.user.findFirst({
          where: {
            phone: candidatePhone,
            NOT: { id: existingUserByAuthId.id },
          },
        });
        if (!phoneConflict) {
          updateData.phone = candidatePhone;
        }
      }

      if (Object.keys(updateData).length > 0) {
        return await prisma.user.update({
          where: { id: existingUserByAuthId.id },
          data: updateData,
          include: {
            profile: true,
            ownerProfile: true,
          },
        });
      }
      return existingUserByAuthId;
    }

    // 2. If not found by Supabase Auth ID, check if user exists by email (e.g. seeded, invited, or re-authenticated)
    if (supabaseUser.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: supabaseUser.email },
        include: {
          profile: true,
          ownerProfile: true,
        },
      });

      if (existingUserByEmail) {
        // Link the existing Prisma record to this Supabase Auth account
        return await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            supabaseAuthId: supabaseUser.id,
          },
          include: {
            profile: true,
            ownerProfile: true,
          },
        });
      }
    }

    // 3. Brand new user: Resolve full name and optional phone safely
    const metadata = supabaseUser.user_metadata || {};
    const resolvedFullName =
      initialData?.fullName?.trim() ||
      metadata.full_name ||
      metadata.name ||
      metadata.fullName ||
      (supabaseUser.email ? supabaseUser.email.split("@")[0] : "New User");

    const rawPhone =
      initialData?.phone ||
      metadata.phone ||
      supabaseUser.phone ||
      null;

    let cleanPhone: string | null =
      typeof rawPhone === "string" && rawPhone.trim().length > 0
        ? rawPhone.trim()
        : null;

    // Guard against unique constraint failure on phone (since phone is optional)
    if (cleanPhone) {
      const conflictingPhoneUser = await prisma.user.findUnique({
        where: { phone: cleanPhone },
      });
      if (conflictingPhoneUser) {
        console.warn(
          `[syncAppUser] Phone "${cleanPhone}" is already registered to user ${conflictingPhoneUser.id}. Falling back to null for new user ${supabaseUser.id}.`
        );
        cleanPhone = null;
      }
    }

    // Create user and profile in an atomic Prisma transaction
    const newUser = await prisma.user.create({
      data: {
        supabaseAuthId: supabaseUser.id,
        email: supabaseUser.email || null,
        phone: cleanPhone,
        profile: {
          create: {
            fullName: resolvedFullName,
          },
        },
      },
      include: {
        profile: true,
        ownerProfile: true,
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error synchronizing Supabase user with database:", error);
    throw error;
  }
}
