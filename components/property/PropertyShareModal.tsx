"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  MapPin,
  CheckCircle2,
  Utensils,
  Share2,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export interface ShareableProperty {
  id: string;
  name: string;
  slug: string;
  locality: string;
  city: string;
  genderPolicy: "BOYS" | "GIRLS" | "UNISEX" | string;
  startingPrice: number;
  originalPrice?: number | null;
  bestSharingOccupancy?: number | null;
  foodIncluded?: boolean;
  coverImageUrl?: string | null;
  images?: string[];
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  roomTypeSummaries?: string[];
}

interface PropertyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: ShareableProperty;
}

// WhatsApp brand icon
function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.35C9.36 7.35 9.09 7.41 8.87 7.65C8.65 7.89 8.02 8.48 8.02 9.7C8.02 10.92 8.91 12.1 9.03 12.26C9.15 12.42 10.74 14.96 13.23 15.97C15.31 16.82 15.73 16.65 16.19 16.61C16.65 16.57 17.67 16.01 17.88 15.42C18.09 14.83 18.09 14.33 18.03 14.22C17.97 14.11 17.81 14.05 17.56 13.93C17.31 13.81 16.09 13.21 15.86 13.13C15.63 13.05 15.47 13.01 15.3 13.25C15.13 13.49 14.66 14.05 14.51 14.22C14.36 14.39 14.22 14.41 13.97 14.29C13.72 14.17 12.92 13.91 11.97 13.06C11.23 12.4 10.73 11.59 10.58 11.34C10.43 11.09 10.56 10.96 10.69 10.83C10.8 10.72 10.94 10.54 11.07 10.39C11.2 10.24 11.24 10.13 11.32 9.97C11.4 9.81 11.36 9.67 11.3 9.55C11.24 9.43 10.76 8.24 10.55 7.75C10.35 7.27 10.15 7.33 10 7.33C9.85 7.33 9.69 7.35 9.53 7.35Z" />
    </svg>
  );
}

export function PropertyShareModal({
  isOpen,
  onClose,
  property,
}: PropertyShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [desktopCopiedNotice, setDesktopCopiedNotice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const previewCardRef = useRef<HTMLDivElement>(null);

  const primaryImage =
    property.coverImageUrl ||
    (property.images && property.images.length > 0
      ? property.images[0]
      : null);

  const occupancyText =
    property.bestSharingOccupancy && property.bestSharingOccupancy > 1
      ? `${property.bestSharingOccupancy}-Sharing`
      : property.roomTypeSummaries && property.roomTypeSummaries.length > 0
      ? property.roomTypeSummaries[0]
      : "Private & Shared Rooms";

  const genderLabel =
    property.genderPolicy === "BOYS"
      ? "Boys PG"
      : property.genderPolicy === "GIRLS"
      ? "Girls PG"
      : "Coliving / Unisex";

  const getFullUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return `${envUrl.replace(/\/$/, "")}/property/${property.slug}`;
    }

    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      // WhatsApp disables link detection on 'localhost' and '127.0.0.1' for security.
      // Use staykro.in in local testing so WhatsApp turns it into a real, clickable blue link!
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return `https://staykro.in/property/${property.slug}`;
      }
      return `${origin}/property/${property.slug}`;
    }

    return `https://staykro.in/property/${property.slug}`;
  };

  const getWhatsAppMessage = (url: string) => {
    const lines = [
      `🏡 *${property.name}* on StayKro`,
      `📍 ${property.locality}, ${property.city}`,
      ``,
      `💰 Rent: *₹${property.startingPrice.toLocaleString("en-IN")}/month* (${occupancyText})`,
      `✨ Highlights:`,
      `• 100% Verified Listing`,
      `• 🚫 Zero Brokerage`,
      property.foodIncluded ? `• 🍽️ Meals / Food Included` : `• 🏠 Fully Furnished & Managed`,
      `• 👥 Find Roommates on StayKro`,
      ``,
      `👉 *View photos, rooms & contact owner:*`,
      url,
    ];
    return lines.join("\n");
  };


  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /**
   * Helper: Draw high-res 1080x1080 social card onto an offscreen canvas
   */
  const renderCardToBlob = async (): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    // 1. Background gradient (Rich StayKro Emerald)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#002016");
    bgGrad.addColorStop(0.5, "#003424");
    bgGrad.addColorStop(1, "#00412E");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative subtle geometric circles
    ctx.fillStyle = "rgba(150, 191, 138, 0.05)";
    ctx.beginPath();
    ctx.arc(width * 0.85, 120, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, height * 0.75, 200, 0, Math.PI * 2);
    ctx.fill();

    // 2. Header Bar (StayKro Brand + Verified Badge)
    // Draw Website Logo Image
    let logoDrawn = false;
    try {
      const logoImg = new Image();
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = reject;
        logoImg.src = "/logo.png";
      });

      const logoX = 60;
      const logoY = 48;
      const logoSize = 54;
      const logoRadius = 14;

      // Crisp white rounded container for logo
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, logoX, logoY, logoSize, logoSize, logoRadius);
      ctx.fill();
      ctx.clip();
      ctx.drawImage(logoImg, logoX + 5, logoY + 5, logoSize - 10, logoSize - 10);
      ctx.restore();

      // Brand Text next to logo
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const textX = logoX + logoSize + 16;
      const textY = logoY + 39;
      ctx.fillText("StayKro", textX, textY);

      // Dot accent in green
      const brandWidth = ctx.measureText("StayKro").width;
      ctx.fillStyle = "#96BF8A";
      ctx.fillText(".", textX + brandWidth, textY);

      logoDrawn = true;
    } catch (err) {
      console.warn("Could not draw logo image to canvas:", err);
    }

    if (!logoDrawn) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("StayKro.", 60, 85);
    }

    // Sub-header badge
    const badgeText = "VERIFIED PG • ZERO BROKERAGE";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const badgeWidth = ctx.measureText(badgeText).width + 36;
    const badgeX = width - 60 - badgeWidth;
    const badgeY = 54;
    const badgeHeight = 44;

    ctx.fillStyle = "rgba(150, 191, 138, 0.15)";
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(150, 191, 138, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#96BF8A";
    ctx.fillText(badgeText, badgeX + 18, badgeY + 29);

    // 3. Property Cover Photo Frame
    const photoX = 60;
    const photoY = 120;
    const photoW = width - 120; // 960
    const photoH = 500;
    const photoRadius = 28;

    // Load Image (via proxy if external to avoid CORS taint)
    let imgLoaded = false;
    if (primaryImage) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const imageSrc = primaryImage.startsWith("http")
          ? `/api/proxy-image?url=${encodeURIComponent(primaryImage)}`
          : primaryImage;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = imageSrc;
        });

        // Clip and draw image
        ctx.save();
        roundRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
        ctx.clip();

        // Calculate aspect fill
        const imgAspect = img.width / img.height;
        const targetAspect = photoW / photoH;
        let dw = photoW;
        let dh = photoH;
        let dx = photoX;
        let dy = photoY;

        if (imgAspect > targetAspect) {
          dw = photoH * imgAspect;
          dx = photoX - (dw - photoW) / 2;
        } else {
          dh = photoW / imgAspect;
          dy = photoY - (dh - photoH) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);

        // Bottom gradient on photo for overlay readability
        const photoGrad = ctx.createLinearGradient(0, photoY + photoH - 180, 0, photoY + photoH);
        photoGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
        photoGrad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
        ctx.fillStyle = photoGrad;
        ctx.fillRect(photoX, photoY + photoH - 180, photoW, 180);

        ctx.restore();
        imgLoaded = true;
      } catch (err) {
        console.warn("Could not draw image to canvas:", err);
      }
    }

    if (!imgLoaded) {
      // Fallback graphic pattern if no photo or offline
      ctx.save();
      roundRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
      ctx.fillStyle = "#00412E";
      ctx.fill();
      ctx.strokeStyle = "rgba(150, 191, 138, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#96BF8A";
      ctx.font = "bold 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏡 Verified Coliving & PG", photoX + photoW / 2, photoY + photoH / 2);
      ctx.restore();
    }

    // Photo Badges (Gender Policy & Meals)
    const renderBadge = (
      text: string,
      x: number,
      y: number,
      bgColor: string,
      textColor: string,
      borderColor?: string
    ) => {
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const txtWidth = ctx.measureText(text).width;
      const padX = 20;
      const bWidth = txtWidth + padX * 2;
      const bHeight = 40;

      ctx.fillStyle = bgColor;
      roundRect(ctx, x, y, bWidth, bHeight, 20);
      ctx.fill();

      if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = textColor;
      ctx.fillText(text, x + padX, y + 26);
      return bWidth;
    };

    let badgeLeft = photoX + 24;
    const badgeTop = photoY + photoH - 58;

    // Gender badge
    const genderBadgeColor =
      property.genderPolicy === "BOYS"
        ? "#2563EB"
        : property.genderPolicy === "GIRLS"
        ? "#E11D48"
        : "#00412E";

    const gW = renderBadge(
      genderLabel.toUpperCase(),
      badgeLeft,
      badgeTop,
      genderBadgeColor,
      "#FFFFFF"
    );
    badgeLeft += gW + 12;

    if (property.foodIncluded) {
      const fW = renderBadge(
        "🍽️ MEALS INCLUDED",
        badgeLeft,
        badgeTop,
        "rgba(24, 24, 27, 0.85)",
        "#FFFFFF"
      );
      badgeLeft += fW + 12;
    }

    if (property.rating) {
      renderBadge(
        `⭐ ${property.rating.toFixed(1)}${
          property.reviewCount ? ` (${property.reviewCount})` : ""
        }`,
        photoX + photoW - 140,
        photoY + 24,
        "rgba(255, 251, 235, 0.95)",
        "#78350F",
        "rgba(245, 158, 11, 0.6)"
      );
    }

    // 4. Property Information (Lower Section)
    const contentY = 660;

    // Location
    ctx.fillStyle = "#96BF8A";
    ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`📍 ${property.locality}, ${property.city}`, 60, contentY);

    // Property Title (large, clean, bold)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // Handle title wrap if very long
    const title = property.name;
    const maxTitleW = width - 120;
    if (ctx.measureText(title).width > maxTitleW) {
      let trimmed = title;
      while (ctx.measureText(trimmed + "...").width > maxTitleW && trimmed.length > 5) {
        trimmed = trimmed.slice(0, -1);
      }
      ctx.fillText(trimmed + "...", 60, contentY + 54);
    } else {
      ctx.fillText(title, 60, contentY + 54);
    }

    // 5. Price & Occupancy Box
    const boxY = contentY + 90;
    const boxH = 110;
    const boxW = width - 120;

    // Glassy dark emerald container
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    roundRect(ctx, 60, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(150, 191, 138, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Price
    ctx.fillStyle = "#96BF8A";
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("STARTING RENT", 86, boxY + 36);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 46px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const priceStr = `₹${property.startingPrice.toLocaleString("en-IN")}`;
    ctx.fillText(priceStr, 86, boxY + 86);

    const priceWidth = ctx.measureText(priceStr).width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "normal 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("/month", 86 + priceWidth + 10, boxY + 84);

    // Occupancy pill inside the box (right-aligned)
    const occText = occupancyText;
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const occWidth = ctx.measureText(occText).width + 36;
    const occX = 60 + boxW - occWidth - 26;
    const occY = boxY + 35;

    ctx.fillStyle = "rgba(150, 191, 138, 0.2)";
    roundRect(ctx, occX, occY, occWidth, 42, 12);
    ctx.fill();
    ctx.strokeStyle = "#96BF8A";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(occText, occX + 18, occY + 28);

    // 6. Value Proposition Pills Strip
    const pillsY = boxY + boxH + 34;
    const valuePills = [
      "🛡️ Verified Owner",
      "⚡ Zero Brokerage",
      "🤝 Roommate Matching",
      "✨ Instant Visit",
    ];

    let pillX = 60;
    ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    for (const pill of valuePills) {
      const pW = ctx.measureText(pill).width + 28;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      roundRect(ctx, pillX, pillsY, pW, 36, 18);
      ctx.fill();

      ctx.fillStyle = "#D1D5DB";
      ctx.fillText(pill, pillX + 14, pillsY + 24);
      pillX += pW + 12;
      if (pillX > width - 180) break;
    }

    // 7. Footer Divider & Brand CTA
    const footerY = height - 70;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, footerY);
    ctx.lineTo(width - 60, footerY);
    ctx.stroke();

    // Call to action text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Discover verified PGs & flats with zero brokerage", 60, footerY + 38);

    ctx.fillStyle = "#96BF8A";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const webUrl = "staykro.in";
    ctx.textAlign = "right";
    ctx.fillText(webUrl, width - 60, footerY + 38);
    ctx.textAlign = "left"; // reset

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      }, "image/png");
    });
  };

  // Canvas helper for rounded rectangles
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /**
   * Action 1: WhatsApp Sharing (Sends BOTH Image + Link/Details)
   * - On Mobile: Uses Web Share API to attach the card image file directly with the text caption into WhatsApp.
   * - On Desktop: WhatsApp Web protocol doesn't accept file uploads via URL links, so we automatically
   *   copy the card image to the user's clipboard and open WhatsApp Web with the text and link.
   *   The user can simply press Ctrl+V in the chat to attach the photo card!
   */
  const handleWhatsAppShare = async () => {
    setIsSharing(true);
    setDesktopCopiedNotice(false);
    const url = getFullUrl();
    const message = getWhatsAppMessage(url);

    try {
      const blob = await renderCardToBlob();
      const file = new File(
        [blob],
        `${property.slug || "staykro-property"}-card.png`,
        { type: "image/png" }
      );

      // 1. Mobile & Web Share API Level 2 (Directly attaches Image + Text Caption into WhatsApp)
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function"
      ) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${property.name} on StayKro`,
              text: message,
              files: [file],
            });
            setIsSharing(false);
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") {
            setIsSharing(false);
            return;
          }
          console.warn("Native file share aborted/failed:", shareErr);
        }
      }

      // 2. Desktop Flow (WhatsApp Web):
      // Automatically copy image to clipboard so pressing Ctrl+V in WhatsApp immediately attaches the card!
      if (typeof navigator?.clipboard?.write === "function") {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopiedImage(true);
          setDesktopCopiedNotice(true);
        } catch (clipErr) {
          console.warn("Could not auto-copy image to clipboard:", clipErr);
        }
      }

      // 3. Open WhatsApp Web / App with pre-filled details & link
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error generating share card:", err);
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Action 2: Download High-Res Card Image (PNG)
   */
  const handleDownloadCard = async () => {
    setIsGenerating(true);
    try {
      const blob = await renderCardToBlob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${property.slug || "staykro-property"}-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Failed to generate share card:", err);
      alert("Could not generate image card. Please copy the link instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Action 3: Copy Image to Clipboard (Desktop WhatsApp Web pasting)
   */
  const handleCopyImage = async () => {
    if (typeof navigator?.clipboard?.write !== "function") {
      alert("Clipboard image copy is not supported in this browser. Please use 'Download Card'.");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await renderCardToBlob();
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      console.error("Failed to copy image to clipboard:", err);
      alert("Failed to copy image to clipboard. Please try downloading it.");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Action 4: Copy Property Link
   */
  const handleCopyLink = () => {
    const url = getFullUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#00412E] border border-[#96BF8A]/40 flex items-center justify-center text-[#96BF8A]">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-sm sm:text-base font-bold text-white">
                Share Property Card
              </h2>
              <p className="text-[11px] text-zinc-400">
                Share photo card & details on WhatsApp or social chats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Live Card Preview Box */}
          <div className="flex flex-col items-center">
            <div
              ref={previewCardRef}
              className="w-full max-w-sm rounded-2xl overflow-hidden border border-[#96BF8A]/30 bg-gradient-to-br from-[#002419] via-[#003424] to-[#00412E] shadow-xl text-white relative transition-transform"
            >
              {/* Card Header Strip */}
              <div className="p-3.5 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative h-6 w-6 rounded-lg bg-white overflow-hidden shadow-xs flex items-center justify-center p-0.5 border border-white/20 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo.png"
                      alt="StayKro Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="font-black text-sm tracking-tight text-white flex items-center">
                    StayKro<span className="text-[#96BF8A]">.</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#96BF8A] bg-[#96BF8A]/15 border border-[#96BF8A]/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified • 0 Brokerage
                </span>
              </div>

              {/* Photo Area */}
              <div className="relative aspect-16/10 mx-3 rounded-xl overflow-hidden bg-zinc-900 shadow-inner">
                {primaryImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={primaryImage}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[#00412E]/50 text-[#96BF8A]">
                    <Sparkles className="h-8 w-8" />
                  </div>
                )}

                {/* Photo Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Overlaid Badges on Photo */}
                <div className="absolute bottom-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs ${
                      property.genderPolicy === "BOYS"
                        ? "bg-blue-600"
                        : property.genderPolicy === "GIRLS"
                        ? "bg-rose-600"
                        : "bg-[#00412E]"
                    }`}
                  >
                    {genderLabel}
                  </span>
                  {property.foodIncluded && (
                    <span className="rounded-full bg-zinc-900/85 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-xs border border-white/10">
                      <Utensils className="h-2.5 w-2.5 text-[#96BF8A]" /> Meals
                    </span>
                  )}
                </div>

                {property.rating && (
                  <div className="absolute top-2.5 right-2.5 rounded-md bg-amber-500/90 text-white font-bold text-[11px] px-2 py-0.5 flex items-center gap-1 shadow-sm backdrop-blur-xs">
                    <span>★ {property.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="p-3.5 space-y-2.5">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-[#96BF8A] font-medium">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {property.locality}, {property.city}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white truncate mt-0.5">
                    {property.name}
                  </h3>
                </div>

                {/* Rent Pill */}
                <div className="rounded-xl bg-black/40 border border-[#96BF8A]/25 p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Starts At
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-white">
                        ₹{property.startingPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-zinc-400 font-normal">/mo</span>
                    </div>
                  </div>
                  <span className="rounded-lg bg-[#96BF8A]/20 border border-[#96BF8A]/40 text-[#96BF8A] text-xs font-bold px-2.5 py-1">
                    {occupancyText}
                  </span>
                </div>

                {/* Key Points */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-zinc-300">
                  <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3 text-[#96BF8A]" /> 100% Verified
                  </span>
                  <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3 text-[#96BF8A]" /> Zero Brokerage
                  </span>
                  <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                    <Sparkles className="h-3 w-3 text-[#96BF8A]" /> Roommate Find
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-3.5 py-2 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 bg-black/25">
                <span>Direct Owner Contact</span>
                <span className="text-[#96BF8A] font-semibold">staykro.in</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Primary: Share on WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isSharing || isGenerating}
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
            >
              {isSharing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <WhatsAppIcon className="h-5 w-5" />
              )}
              <span>Share to WhatsApp</span>
            </button>

            {/* Secondary Grid: Download HD Card & Copy Image */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadCard}
                disabled={isGenerating}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#96BF8A]" />
                ) : (
                  <Download className="h-4 w-4 text-[#96BF8A]" />
                )}
                <span>Download Card</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isGenerating}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
              >
                {copiedImage ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Card Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-zinc-400" />
                    <span>Copy Card Image</span>
                  </>
                )}
              </button>
            </div>

            {/* Tertiary: Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-800 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Link copied to clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Copy Direct Link</span>
                </>
              )}
            </button>

            {/* Desktop Instant Paste Notice */}
            {desktopCopiedNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <p className="font-bold text-white">
                    Photo Card copied to your clipboard!
                  </p>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                    WhatsApp opened in a new tab with your link. Simply press{" "}
                    <kbd className="px-1.5 py-0.5 bg-black/50 rounded border border-emerald-500/30 text-white font-mono font-bold">
                      Ctrl + V
                    </kbd>{" "}
                    in the chat to attach this photo card together with the link!
                  </p>
                </div>
              </div>
            )}

            {/* Explanatory sharing tip */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <span>💡</span>
                <span>Sending Image & Link together:</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                • <strong>On Mobile (Phones):</strong> WhatsApp attaches the photo card and message caption automatically in 1 click!
                <br />
                • <strong>On Desktop (PC):</strong> We auto-copy the card image to your clipboard — just press{" "}
                <kbd className="text-zinc-200 font-mono bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700">Ctrl + V</kbd>{" "}
                in your WhatsApp chat to send both!
                <br />
                • <strong>Live Link Preview:</strong> When deployed to your live domain (Vercel), WhatsApp will also automatically render the property image card above the link!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
