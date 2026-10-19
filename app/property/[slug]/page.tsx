import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PropertyDetailClient } from "@/components/property/PropertyDetailClient";

interface PropertyPageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;

  const property = await prisma.property.findUnique({
    where: { slug },
    select: {
      name: true,
      locality: true,
      city: true,
      startingPrice: true,
      description: true,
      images: {
        where: { isCover: true },
        select: { url: true },
        take: 1,
      },
    },
  });

  if (!property) {
    return {
      title: "Property Not Found | StayKro",
      description: "The requested accommodation could not be found.",
    };
  }

  const allActiveRoomTypes = await prisma.roomType.findMany({
    where: { property: { slug }, isActive: true },
    select: { monthlyRent: true, occupancy: true },
  });

  let bestPerPerson = Infinity;
  let effectiveStartingPrice = property.startingPrice || 0;
  for (const rt of allActiveRoomTypes) {
    const perPerson = rt.occupancy > 1 ? Math.round(rt.monthlyRent / rt.occupancy) : rt.monthlyRent;
    if (perPerson < bestPerPerson) {
      bestPerPerson = perPerson;
      effectiveStartingPrice = perPerson;
    }
  }

  const priceFormatted = effectiveStartingPrice
    ? `From ₹${effectiveStartingPrice.toLocaleString("en-IN")}/mo`
    : "Best Rates";
  const title = `${property.name} in ${property.locality}, ${property.city} | ${priceFormatted} — StayKro`;
  const description =
    property.description ||
    `Verified PG & coliving stay in ${property.locality}, ${property.city} with zero brokerage. Direct owner contact and furnished rooms.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: property.images[0]?.url ? [{ url: property.images[0].url }] : [],
    },
  };
}

async function PropertyDataLoader({ params }: PropertyPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      },
      amenities: {
        include: { amenity: true },
      },
      roomTypes: {
        where: { isActive: true },
        include: {
          rooms: {
            select: { id: true, occupiedBeds: true, status: true },
          },
          amenities: {
            include: { amenity: true },
          },
        },
        orderBy: { monthlyRent: "asc" },
      },
      owner: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
      reviews: {
        where: { status: "APPROVED" },
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!property || property.deletedAt) {
    notFound();
  }

  // If draft or unapproved, only allow owner or admin to preview
  if (property.status !== "PUBLISHED") {
    const isOwner = property.owner?.userId === user?.id;
    const isAdmin = user?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      notFound();
    }
  }

  const activeRoomTypes = property.roomTypes.filter((r) => r.isActive !== false);

  let bestPerPerson = Infinity;
  let startingPrice = property.startingPrice || 0;
  for (const rt of activeRoomTypes) {
    const perPerson = rt.occupancy > 1 ? Math.round(rt.monthlyRent / rt.occupancy) : rt.monthlyRent;
    if (perPerson < bestPerPerson) {
      bestPerPerson = perPerson;
      startingPrice = perPerson;
    }
  }

  const serializedProperty = {
    id: property.id,
    name: property.name,
    slug: property.slug,
    description: property.description,
    propertyType: property.propertyType,
    genderPolicy: property.genderPolicy,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2,
    locality: property.locality,
    city: property.city,
    state: property.state,
    postalCode: property.postalCode,
    latitude: property.latitude,
    longitude: property.longitude,
    contactPhone:
      property.contactPhone && property.contactPhone !== "Not provided"
        ? property.contactPhone
        : property.owner?.contactPhone && property.owner.contactPhone !== "Not provided"
        ? property.owner.contactPhone
        : "",
    whatsappNumber:
      property.whatsappNumber && property.whatsappNumber !== "Not provided"
        ? property.whatsappNumber
        : property.owner?.whatsappNumber && property.owner.whatsappNumber !== "Not provided"
        ? property.owner.whatsappNumber
        : property.owner?.contactPhone && property.owner.contactPhone !== "Not provided"
        ? property.owner.contactPhone
        : property.contactPhone && property.contactPhone !== "Not provided"
        ? property.contactPhone
        : "",
    gateClosingTime: property.gateClosingTime,
    noticePeriodDays: property.noticePeriodDays,
    houseRules: property.houseRules,
    foodIncluded: property.foodIncluded,
    foodOffering: property.foodOffering,
    startingPrice,
    isVerified: property.isVerified,
    images: property.images.map((img) => ({
      id: img.id,
      url: img.url,
      imageType: img.imageType,
      altText: img.altText,
      isCover: img.isCover,
    })),
    amenities: property.amenities.map((pa) => ({
      id: pa.amenity.id,
      name: pa.amenity.name,
      category: pa.amenity.category,
      icon: pa.amenity.icon,
      note: pa.note,
    })),
    roomTypes: property.roomTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      occupancy: rt.occupancy,
      monthlyRent: rt.monthlyRent,
      securityDeposit: rt.securityDeposit,
      maintenanceCharges: rt.maintenanceCharges,
      foodCharges: rt.foodCharges,
      description: rt.description,
      hasAttachedBathroom: rt.hasAttachedBathroom,
      hasBalcony: rt.hasBalcony,
      hasAirConditioning: rt.hasAirConditioning,
      rooms: rt.rooms.map((r) => ({
        id: r.id,
        occupiedBeds: r.occupiedBeds,
        status: r.status,
      })),
    })),
    owner: {
      fullName:
        property.owner?.user?.profile?.fullName ||
        property.owner?.businessName ||
        "Property Host",
      companyName: property.owner?.businessName || null,
      isVerified: property.owner?.verificationStatus === "VERIFIED",
    },
    reviews: property.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      cleanliness: r.cleanliness,
      foodQuality: r.foodQuality,
      safety: r.safety,
      createdAt: r.createdAt.toISOString(),
      user: {
        fullName: r.user.profile?.fullName || "Verified Resident",
        avatarUrl: r.user.profile?.avatarUrl || null,
      },
    })),
  };

  const serializedUser = user
    ? {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              avatarUrl: user.profile.avatarUrl,
            }
          : null,
      }
    : null;

  return (
    <PropertyDetailClient
      property={serializedProperty}
      currentUser={serializedUser}
    />
  );
}

export default function PropertyPage({ params }: PropertyPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4" />
          <h2 className="text-base font-bold text-zinc-900">Loading Property Details...</h2>
          <p className="text-xs text-zinc-500 mt-1">Fetching room inventory, photos, and direct owner contact.</p>
        </div>
      }
    >
      <PropertyDataLoader params={params} />
    </Suspense>
  );
}
