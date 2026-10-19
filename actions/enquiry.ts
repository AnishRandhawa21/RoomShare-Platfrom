"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { EnquiryChannel } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { rateLimiters } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export type EnquiryActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function submitPGEnquiryAction(formData: FormData): Promise<EnquiryActionResult> {
  const propertyId = formData.get("propertyId")?.toString();
  const roomTypeId = formData.get("roomTypeId")?.toString() || null;
  const rawVisitorName = formData.get("visitorName")?.toString().trim();
  const visitorPhone = formData.get("visitorPhone")?.toString().trim();
  const rawVisitorEmail = formData.get("visitorEmail")?.toString().trim() || null;
  const rawMessage = formData.get("message")?.toString().trim() || null;
  const moveInDateRaw = formData.get("moveInDate")?.toString();
  const channelRaw = formData.get("channel")?.toString() || "WEBSITE_FORM";

  if (!propertyId || !rawVisitorName || !visitorPhone) {
    return {
      success: false,
      error: "Please provide your name, phone number, and select a property.",
    };
  }

  // Basic phone format validation
  const cleanPhone = visitorPhone.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return {
      success: false,
      error: "Please enter a valid 10-digit mobile number.",
    };
  }

  // Rate Limiting (max 10 enquiries per hour per phone)
  const rateLimit = rateLimiters.enquiry(cleanPhone);
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many enquiries submitted. Please wait before contacting more properties.",
    };
  }

  const visitorName = sanitizeText(rawVisitorName, 80);
  const visitorEmail = rawVisitorEmail ? sanitizeText(rawVisitorEmail, 120) : null;
  const message = rawMessage ? sanitizeText(rawMessage, 1000) : null;

  const currentUser = await getCurrentUser();

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, slug: true, status: true },
    });

    if (!property) {
      return { success: false, error: "Property not found." };
    }

    let channel: EnquiryChannel = "WEBSITE_FORM";
    if (channelRaw === "DIRECT_CALL") channel = "DIRECT_CALL";
    if (channelRaw === "WHATSAPP" || channelRaw === "WHATSAPP_CLICK") channel = "WHATSAPP_CLICK";

    let moveInDate: Date | null = null;
    if (moveInDateRaw) {
      const parsed = new Date(moveInDateRaw);
      if (!isNaN(parsed.getTime())) {
        moveInDate = parsed;
      }
    }

    await prisma.pGEnquiry.create({
      data: {
        propertyId,
        roomTypeId,
        userId: currentUser?.id || null,
        visitorName,
        visitorPhone,
        visitorEmail,
        channel,
        moveInDate,
        message,
      },
    });

    try {
      revalidatePath(`/property/${property.slug}`);
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      message: "Enquiry submitted successfully! The property manager will contact you shortly.",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to submit enquiry.";
    console.error("Enquiry submission error:", error);
    return { success: false, error: errorMsg };
  }
}
