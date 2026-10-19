import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://staykro.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/property/",
          "/pg/",
          "/roommates",
          "/login",
          "/signup",
        ],
        disallow: [
          "/admin/",
          "/owner/",
          "/chat/",
          "/saved/",
          "/profile/",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
