"use client";

import { useState } from "react";
import { Image as ImageIcon, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { ImageType } from "@/lib/prisma";

export interface PropertyGalleryImage {
  id: string;
  url: string;
  imageType: ImageType;
  altText: string | null;
  isCover: boolean;
}

interface PropertyGalleryProps {
  images: PropertyGalleryImage[];
  propertyName: string;
}

export function PropertyGallery({ images, propertyName }: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative aspect-21/9 w-full rounded-3xl bg-zinc-100 flex flex-col items-center justify-center text-zinc-400 p-8 border border-zinc-200">
        <ImageIcon className="h-12 w-12 text-zinc-300 mb-2" />
        <p className="text-sm font-semibold text-zinc-500">No photos uploaded for this property yet.</p>
        <p className="text-xs text-zinc-400">Photos will appear here once verified by the owner.</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main Featured Photo */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="group relative aspect-16/9 sm:aspect-21/9 w-full rounded-3xl overflow-hidden bg-zinc-900 cursor-pointer shadow-sm border border-zinc-200/80"
      >
        <img
          src={currentImage.url}
          alt={currentImage.altText || propertyName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Gradient Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          {currentImage.isCover && (
            <span className="rounded-full bg-[#00412E] border border-[#96BF8A]/40 px-3 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#96BF8A]" /> Primary Cover
            </span>
          )}
          <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
            {currentImage.imageType}
          </span>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-md transition-all hover:bg-white hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-md transition-all hover:bg-white hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Photo Counter */}
        <div className="absolute bottom-4 right-4 rounded-full bg-black/70 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-18 sm:h-20 w-28 sm:w-32 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                selectedIndex === idx
                  ? "border-[#00412E] ring-2 ring-[#96BF8A]/40 scale-98"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || `${propertyName} photo ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                {img.imageType}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close fullscreen gallery"
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] max-w-5xl overflow-hidden rounded-2xl"
          >
            <img
              src={currentImage.url}
              alt={currentImage.altText || propertyName}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold px-4 py-2 bg-black/60 rounded-xl backdrop-blur-sm">
              <span>{propertyName} — {currentImage.imageType}</span>
              <span>{selectedIndex + 1} of {images.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
