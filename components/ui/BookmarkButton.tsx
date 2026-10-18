"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import {
  toggleSavePropertyAction,
  toggleSaveRoommateAction,
} from "@/actions/saved";

interface BookmarkButtonProps {
  targetId: string;
  targetType: "PROPERTY" | "ROOMMATE";
  initialSaved?: boolean;
  className?: string;
  size?: "sm" | "md";
  onToggle?: (isSaved: boolean) => void;
}

export function BookmarkButton({
  targetId,
  targetType,
  initialSaved = false,
  className = "",
  size = "md",
  onToggle,
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState<boolean>(initialSaved);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    const previousState = isSaved;
    setIsSaved(!previousState);
    setIsLoading(true);

    try {
      const res =
        targetType === "PROPERTY"
          ? await toggleSavePropertyAction(targetId)
          : await toggleSaveRoommateAction(targetId);

      if (res.success && res.isSaved !== undefined) {
        setIsSaved(res.isSaved);
        if (onToggle) onToggle(res.isSaved);
      } else {
        setIsSaved(previousState);
        if (res.error?.includes("sign in")) {
          window.location.href = `/login?returnUrl=${encodeURIComponent(
            window.location.pathname
          )}`;
        } else {
          alert(res.error || "Failed to update bookmark.");
        }
      }
    } catch {
      setIsSaved(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  };

  const buttonSizes = {
    sm: "h-7 w-7",
    md: "h-8.5 w-8.5",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSaved ? "Remove from saved" : "Save listing"}
      className={`flex items-center justify-center rounded-full transition-all cursor-pointer ${
        buttonSizes[size]
      } ${
        isSaved
          ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
          : "bg-white/90 backdrop-blur-xs text-zinc-500 hover:text-rose-600 hover:bg-white shadow-xs border border-zinc-200/80"
      } ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform ${
          isSaved ? "fill-rose-600 scale-110" : ""
        }`}
      />
    </button>
  );
}
