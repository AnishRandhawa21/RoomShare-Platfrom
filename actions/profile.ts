"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { GenderPolicy } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ProfileActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function updateProfileAction(
  prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please sign in to update your profile." };
  }

  const fullName = formData.get("fullName")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const bio = formData.get("bio")?.toString().trim() || null;
  const genderRaw = formData.get("gender")?.toString();
  const ageRaw = formData.get("age")?.toString();
  const profession = formData.get("profession")?.toString().trim() || null;
  const companyOrCollege = formData.get("companyOrCollege")?.toString().trim() || null;
  const city = formData.get("city")?.toString().trim() || null;

  if (!fullName) {
    return { success: false, error: "Full Name is required." };
  }

  let gender: GenderPolicy | null = null;
  if (genderRaw && ["BOYS", "GIRLS", "UNISEX"].includes(genderRaw)) {
    gender = genderRaw as GenderPolicy;
  }

  let age: number | null = null;
  if (ageRaw && !isNaN(parseInt(ageRaw, 10))) {
    age = parseInt(ageRaw, 10);
    if (age < 16 || age > 99) {
      return { success: false, error: "Please enter a valid age between 16 and 99." };
    }
  }

  try {
    // Update user phone if provided or changed
    if (phone !== currentUser.phone) {
      if (phone) {
        const conflictingPhone = await prisma.user.findFirst({
          where: {
            phone,
            NOT: { id: currentUser.id },
          },
        });
        if (conflictingPhone) {
          return {
            success: false,
            error: "This phone number is already registered to another user.",
          };
        }
      }

      await prisma.user.update({
        where: { id: currentUser.id },
        data: { phone },
      });
    }

    // Upsert or update profile
    await prisma.profile.upsert({
      where: { userId: currentUser.id },
      update: {
        fullName,
        bio,
        gender,
        age,
        profession,
        companyOrCollege,
        city,
      },
      create: {
        userId: currentUser.id,
        fullName,
        bio,
        gender,
        age,
        profession,
        companyOrCollege,
        city,
      },
    });

    // If user has an owner profile, also update business name and WhatsApp contact
    const businessName = formData.get("businessName")?.toString().trim() || null;
    const whatsappNumber = formData.get("whatsappNumber")?.toString().trim() || null;

    if (currentUser.ownerProfile) {
      await prisma.ownerProfile.update({
        where: { id: currentUser.ownerProfile.id },
        data: {
          ...(businessName !== null ? { businessName } : {}),
          ...(whatsappNumber !== null ? { whatsappNumber } : {}),
          contactPhone: phone || currentUser.ownerProfile.contactPhone,
        },
      });
    }

    revalidatePath("/profile");
    revalidatePath("/owner");
    revalidatePath("/owner/properties");
    revalidatePath("/admin");
    return { success: true, message: "Profile updated successfully!" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile.";
    console.error("Profile update error:", err);
    return { success: false, error: message };
  }
}
