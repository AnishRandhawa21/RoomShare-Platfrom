"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Role, OwnerInvitationStatus, VerificationStatus } from "@/lib/enums";
import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

const INVITE_EXPIRY_DAYS = parseInt(process.env.OWNER_INVITE_EXPIRY_DAYS || "7", 10);

/**
 * Ensures the authenticated user is an ADMIN.
 * Returns the admin User record or throws an error.
 */
export async function requireAdminContext() {
  const user = await requireUser("/login");

  if (user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin privileges required.");
  }

  return user;
}

/**
 * Hashes a plaintext invitation token with SHA-256 for secure database lookup.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface CreateInvitationInput {
  email: string;
  inviteeName?: string;
}

/**
 * Creates a new owner invitation with a cryptographically secure token.
 * Only callable by ADMINs.
 */
export async function createOwnerInvitationAction(input: CreateInvitationInput) {
  try {
    const admin = await requireAdminContext();

    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Generate 64-hex-char cryptographically secure random token
    const plaintextToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(plaintextToken);

    // Calculate expiration date (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    // Revoke any existing pending invitations for this email to prevent confusion
    await prisma.ownerInvitation.updateMany({
      where: {
        email: normalizedEmail,
        status: OwnerInvitationStatus.PENDING,
      },
      data: {
        status: OwnerInvitationStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    // Create the invitation
    const invitation = await prisma.ownerInvitation.create({
      data: {
        email: normalizedEmail,
        inviteeName: input.inviteeName?.trim() || null,
        tokenHash,
        status: OwnerInvitationStatus.PENDING,
        createdByAdminId: admin.id,
        expiresAt,
      },
    });

    revalidatePath("/admin/invitations");

    return {
      success: true,
      token: plaintextToken,
      inviteLink: `/owner/invite/${plaintextToken}`,
      invitation,
    };
  } catch (error: unknown) {
    console.error("createOwnerInvitationAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create invitation.",
    };
  }
}

/**
 * Lists all owner invitations.
 * Only callable by ADMINs.
 */
export async function listOwnerInvitationsAction() {
  try {
    await requireAdminContext();

    const now = new Date();

    // Auto-expire outdated pending invitations
    await prisma.ownerInvitation.updateMany({
      where: {
        status: OwnerInvitationStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: {
        status: OwnerInvitationStatus.EXPIRED,
      },
    });

    const invitations = await prisma.ownerInvitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdByAdmin: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
        acceptedByUser: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    return { success: true, invitations };
  } catch (error: unknown) {
    console.error("listOwnerInvitationsAction error:", error);
    return {
      success: false,
      invitations: [],
      error: error instanceof Error ? error.message : "Failed to list invitations.",
    };
  }
}

/**
 * Revokes a pending owner invitation.
 * Only callable by ADMINs.
 */
export async function revokeOwnerInvitationAction(invitationId: string) {
  try {
    await requireAdminContext();

    const invite = await prisma.ownerInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invite) {
      return { success: false, error: "Invitation not found." };
    }

    if (invite.status !== OwnerInvitationStatus.PENDING) {
      return {
        success: false,
        error: `Cannot revoke invitation with status "${invite.status}".`,
      };
    }

    const updated = await prisma.ownerInvitation.update({
      where: { id: invitationId },
      data: {
        status: OwnerInvitationStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    revalidatePath("/admin/invitations");

    return { success: true, invitation: updated };
  } catch (error: unknown) {
    console.error("revokeOwnerInvitationAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke invitation.",
    };
  }
}

/**
 * Validates an invitation token for the invite landing page.
 * Publicly callable with token.
 */
export async function getInvitationByTokenAction(token: string) {
  try {
    if (!token || token.length < 32) {
      return { success: false, error: "Invalid invitation link." };
    }

    const tokenHash = hashToken(token);
    const invite = await prisma.ownerInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invite) {
      return { success: false, error: "Invitation link not found or invalid." };
    }

    // Check expiration
    if (invite.status === OwnerInvitationStatus.PENDING && invite.expiresAt < new Date()) {
      await prisma.ownerInvitation.update({
        where: { id: invite.id },
        data: { status: OwnerInvitationStatus.EXPIRED },
      });
      return {
        success: false,
        error: "This invitation link has expired. Please request a new invitation.",
        status: OwnerInvitationStatus.EXPIRED,
      };
    }

    if (invite.status === OwnerInvitationStatus.REVOKED) {
      return {
        success: false,
        error: "This invitation link has been revoked by an administrator.",
        status: OwnerInvitationStatus.REVOKED,
      };
    }

    if (invite.status === OwnerInvitationStatus.ACCEPTED) {
      return {
        success: false,
        error: "This invitation has already been accepted.",
        status: OwnerInvitationStatus.ACCEPTED,
      };
    }

    return {
      success: true,
      invitation: {
        id: invite.id,
        email: invite.email,
        inviteeName: invite.inviteeName,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    };
  } catch (error: unknown) {
    console.error("getInvitationByTokenAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to validate invitation.",
    };
  }
}

/**
 * Accepts an owner invitation.
 * Guarantees:
 * 1. Token exists and is PENDING.
 * 2. Authenticated user's email matches invitation email.
 * 3. Idempotent: Upgrades user role to OWNER and provisions OwnerProfile.
 */
export async function acceptOwnerInvitationAction(token: string) {
  try {
    const user = await requireUser();

    if (!token || token.length < 32) {
      return { success: false, error: "Invalid invitation token." };
    }

    const tokenHash = hashToken(token);
    const invite = await prisma.ownerInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invite) {
      return { success: false, error: "Invitation not found." };
    }

    // Check already accepted by this user (Idempotent replay)
    if (invite.status === OwnerInvitationStatus.ACCEPTED && invite.acceptedByUserId === user.id) {
      return { success: true, redirectUrl: "/owner/onboarding" };
    }

    if (invite.status !== OwnerInvitationStatus.PENDING) {
      return {
        success: false,
        error: `Invitation cannot be accepted because it is ${invite.status.toLowerCase()}.`,
      };
    }

    if (invite.expiresAt < new Date()) {
      await prisma.ownerInvitation.update({
        where: { id: invite.id },
        data: { status: OwnerInvitationStatus.EXPIRED },
      });
      return { success: false, error: "This invitation has expired." };
    }

    // Strict Email Matching
    const userEmail = (user.email || "").trim().toLowerCase();
    const invitedEmail = invite.email.trim().toLowerCase();

    if (userEmail !== invitedEmail) {
      return {
        success: false,
        emailMismatch: true,
        invitedEmail: invite.email,
        currentEmail: user.email,
        error: `This invitation was sent to ${invite.email}. You are currently signed in as ${user.email}.`,
      };
    }

    // Transactional acceptance: updates invitation, user role, and creates OwnerProfile
    await prisma.$transaction(async (tx) => {
      // 1. Mark invitation accepted
      await tx.ownerInvitation.update({
        where: { id: invite.id },
        data: {
          status: OwnerInvitationStatus.ACCEPTED,
          acceptedByUserId: user.id,
          acceptedAt: new Date(),
        },
      });

      // 2. Upgrade user role to OWNER
      if (user.role === Role.USER) {
        await tx.user.update({
          where: { id: user.id },
          data: { role: Role.OWNER },
        });
      }

      // 3. Upsert OwnerProfile (Verified by admin invite, NO govt ID required)
      await tx.ownerProfile.upsert({
        where: { userId: user.id },
        update: {
          verificationStatus: VerificationStatus.VERIFIED,
          verifiedAt: new Date(),
        },
        create: {
          userId: user.id,
          contactPhone: user.phone || "Not provided",
          verificationStatus: VerificationStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });
    });

    revalidatePath("/owner/onboarding");
    revalidatePath("/owner/properties");
    revalidatePath("/admin/invitations");

    return {
      success: true,
      redirectUrl: "/owner/onboarding",
    };
  } catch (error: unknown) {
    console.error("acceptOwnerInvitationAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to accept invitation.",
    };
  }
}
