"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Star,
  AlertCircle,
  ArrowLeft,
  Bed,
  Sparkles,
} from "lucide-react";
import {
  deletePropertyImageAction,
  setPropertyCoverImageAction,
  uploadPropertyImageDirectAction,
} from "@/actions/upload";
import { ImageType } from "@/lib/prisma";

export interface PropertyImageItem {
  id: string;
  storageKey: string;
  url: string;
  imageType: ImageType;
  sortOrder: number;
  altText: string | null;
  isCover: boolean;
  createdAt: Date | string;
}

interface PropertyPhotoManagerProps {
  property: {
    id: string;
    name: string;
    slug: string;
    locality: string;
    city: string;
    images: PropertyImageItem[];
  };
}

const IMAGE_CATEGORIES: { id: ImageType; label: string }[] = [
  { id: "FACADE", label: "Building Exterior / Entrance" },
  { id: "BEDROOM", label: "Bedroom & Living Space" },
  { id: "WASHROOM", label: "Attached Washroom" },
  { id: "DINING", label: "Dining & Mess Area" },
  { id: "COMMON_AREA", label: "Common Lounge / Terrace" },
  { id: "BALCONY", label: "Balcony / View" },
  { id: "OTHER", label: "Other Amenities" },
];

export function PropertyPhotoManager({ property }: PropertyPhotoManagerProps) {
  const router = useRouter();
  const [images, setImages] = useState<PropertyImageItem[]>(property.images || []);
  const [selectedCategory, setSelectedCategory] = useState<ImageType>("BEDROOM");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (property.images) {
      setImages(property.images);
    }
  }, [property.images]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFileUpload(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFileUpload = async (file: File) => {
    // 1. Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      setStatusMessage({
        type: "error",
        text: "Unsupported file type. Please upload JPEG, PNG, WebP, or AVIF images.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "File size exceeds the 10MB limit. Please compress the image.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("propertyId", property.id);
      formData.append("file", file);
      formData.append("imageType", selectedCategory);
      formData.append("isCover", String(images.length === 0));

      setUploadProgress(50);

      const res = await uploadPropertyImageDirectAction(formData);

      if (!res.success || !res.image) {
        throw new Error(res.error || "Failed to upload image.");
      }

      setUploadProgress(100);

      const uploadedItem: PropertyImageItem = {
        id: res.image.id,
        storageKey: res.image.storageKey,
        url: res.image.url,
        imageType: res.image.imageType || "BEDROOM",
        sortOrder: res.image.sortOrder,
        altText: null,
        isCover: Boolean(res.image.isCover),
        createdAt: new Date().toISOString(),
      };

      // Update local state
      setImages((prev) => {
        if (uploadedItem.isCover) {
          return [...prev.map((img) => ({ ...img, isCover: false })), uploadedItem];
        }
        return [...prev, uploadedItem];
      });

      setStatusMessage({
        type: "success",
        text: "Photo successfully uploaded to Cloudflare R2 and linked to property!",
      });
      router.refresh();
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : "Upload failed. Please check network and try again.";
      setStatusMessage({
        type: "error",
        text: message,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSetCover = async (imageId: string) => {
    try {
      const res = await setPropertyCoverImageAction(imageId);
      if (res.success) {
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            isCover: img.id === imageId,
          }))
        );
        setStatusMessage({
          type: "success",
          text: "Cover photo updated successfully.",
        });
        router.refresh();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to set cover photo.",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update cover photo.";
      setStatusMessage({
        type: "error",
        text: message,
      });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to permanently delete this photo?")) return;

    try {
      const res = await deletePropertyImageAction(imageId);
      if (res.success) {
        setImages((prev) => {
          const remaining = prev.filter((img) => img.id !== imageId);
          // If we deleted the cover photo and there are remaining photos, mark the first one as cover
          const hadCover = prev.find((img) => img.id === imageId)?.isCover;
          if (hadCover && remaining.length > 0) {
            remaining[0].isCover = true;
          }
          return remaining;
        });
        setStatusMessage({
          type: "success",
          text: "Photo deleted from Cloudflare R2 and database.",
        });
        router.refresh();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to delete photo.",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete photo.";
      setStatusMessage({
        type: "error",
        text: message,
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <Link
            href="/owner/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Property Portfolio</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              {property.name}
            </h1>
            <span className="rounded-full bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 text-xs">
              {property.city}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            {property.locality}, {property.city} • Manage Cloudflare R2 high-resolution photo gallery
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200/80">
          <Link
            href={`/owner/properties/${property.id}/rooms`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <Bed className="h-4 w-4" />
            <span>Rooms & Inventory</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-indigo-600 shadow-xs">
            <ImageIcon className="h-4 w-4" />
            <span>Photos & Media</span>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`mt-6 rounded-2xl p-4 border text-xs sm:text-sm font-semibold flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : statusMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-indigo-50 border-indigo-200 text-indigo-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Cloudflare R2 Upload Dropzone & Category Picker */}
      <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Direct Cloudflare R2 Upload Pipeline</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-950">
            Add New Property Photos
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 leading-relaxed">
            Upload clear, high-quality photos. Presigned URLs are generated securely on-demand, allowing client-to-R2 direct upload with zero server egress bottlenecks.
          </p>
        </div>

        {/* Category Selector */}
        <div className="mt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
            Select Photo Category:
          </label>
          <div className="flex flex-wrap gap-2">
            {IMAGE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileSelect}
            className="hidden"
            id="property-file-input"
          />

          <label
            htmlFor="property-file-input"
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-8 sm:p-12 text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50/20 ${
              isUploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-xs">
              <Upload className="h-7 w-7" />
            </div>
            <div className="text-sm font-bold text-zinc-900">
              Click to select a photo, or drag and drop
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Category: <span className="font-bold text-indigo-600">{IMAGE_CATEGORIES.find(c => c.id === selectedCategory)?.label}</span>
            </p>
            <p className="mt-2 text-[11px] text-zinc-400">
              Supports JPEG, PNG, WebP, AVIF up to 10MB
            </p>
          </label>

          {/* Progress bar */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-bold text-zinc-700">
                <span>Uploading directly to Cloudflare R2...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-950">
              Property Gallery ({images.length} photos)
            </h3>
            <p className="text-xs text-zinc-500">
              The cover photo will be displayed prominently across search results and listing previews.
            </p>
          </div>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div
                key={img.id}
                className={`group relative rounded-2xl border bg-white overflow-hidden shadow-xs transition-all ${
                  img.isCover
                    ? "border-indigo-600 ring-2 ring-indigo-600/20"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {/* Image preview */}
                <div className="relative aspect-4/3 w-full bg-zinc-100 overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.altText || property.name}
                    className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    {img.isCover && (
                      <span className="rounded-full bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-xs flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white" /> Primary Cover
                      </span>
                    )}
                    <span className="rounded-full bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5">
                      {img.imageType}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-white flex items-center justify-between border-t border-zinc-100">
                  {!img.isCover ? (
                    <button
                      type="button"
                      onClick={() => handleSetCover(img.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Set as Cover</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Cover Active
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    title="Delete photo"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center bg-white">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-3">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900">No photos uploaded yet</h4>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Properties with at least 4 photos receive 3x more direct booking enquiries from seekers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
