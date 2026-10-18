import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PropertyPhotoManager } from "@/components/owner/PropertyPhotoManager";

interface PropertyPhotosPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Property Photos & Media | StayKro Owner",
  description: "Manage high-resolution Cloudflare R2 property gallery photos.",
};

async function PhotosDataLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/photos`);
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: true,
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!property) {
    notFound();
  }

  const isOwner = property.owner?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    redirect("/owner/properties");
  }

  const serializedProperty = {
    id: property.id,
    name: property.name,
    slug: property.slug,
    locality: property.locality,
    city: property.city,
    images: property.images.map((img) => ({
      id: img.id,
      storageKey: img.storageKey,
      url: img.url,
      imageType: img.imageType,
      sortOrder: img.sortOrder,
      altText: img.altText,
      isCover: img.isCover,
      createdAt: img.createdAt.toISOString(),
    })),
  };

  return <PropertyPhotoManager property={serializedProperty} />;
}

export default function PropertyPhotosPage({ params }: PropertyPhotosPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-zinc-500">Loading photo gallery from Cloudflare R2...</p>
        </div>
      }
    >
      <PhotosDataLoader params={params} />
    </Suspense>
  );
}
