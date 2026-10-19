import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { APP_BASE_URL, toSlug } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // 1. Static Core Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${APP_BASE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${APP_BASE_URL}/roommates`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${APP_BASE_URL}/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${APP_BASE_URL}/signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    // 2. Fetch all published properties
    const properties = await prisma.property.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
      },
      select: {
        slug: true,
        city: true,
        locality: true,
        updatedAt: true,
      },
    });

    const propertyRoutes: MetadataRoute.Sitemap = properties.map((prop) => ({
      url: `${APP_BASE_URL}/property/${prop.slug}`,
      lastModified: prop.updatedAt || currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

    // 3. Fetch Master Cities and Localities
    const masterCities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        localities: {
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
        },
      },
    });

    const cityRoutes: MetadataRoute.Sitemap = [];
    const localityRoutes: MetadataRoute.Sitemap = [];

    // Also collect city/locality pairs from published properties
    const citySet = new Set<string>();
    const cityLocalityMap = new Map<string, Set<string>>();

    masterCities.forEach((c) => {
      citySet.add(c.slug);
      if (!cityLocalityMap.has(c.slug)) {
        cityLocalityMap.set(c.slug, new Set());
      }
      c.localities.forEach((loc) => {
        cityLocalityMap.get(c.slug)?.add(loc.slug);
      });
    });

    properties.forEach((p) => {
      const cSlug = toSlug(p.city);
      const lSlug = toSlug(p.locality);
      if (cSlug) {
        citySet.add(cSlug);
        if (!cityLocalityMap.has(cSlug)) {
          cityLocalityMap.set(cSlug, new Set());
        }
        if (lSlug) {
          cityLocalityMap.get(cSlug)?.add(lSlug);
        }
      }
    });

    // Generate City routes
    citySet.forEach((cSlug) => {
      cityRoutes.push({
        url: `${APP_BASE_URL}/pg/${cSlug}`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.8,
      });
    });

    // Generate Locality routes
    cityLocalityMap.forEach((localities, cSlug) => {
      localities.forEach((lSlug) => {
        localityRoutes.push({
          url: `${APP_BASE_URL}/pg/${cSlug}/${lSlug}`,
          lastModified: currentDate,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      });
    });

    return [...staticRoutes, ...cityRoutes, ...localityRoutes, ...propertyRoutes];
  } catch (err) {
    console.error("Error generating dynamic sitemap:", err);
    return staticRoutes;
  }
}
