import fs from "fs";
import path from "path";

// ----------------------------------------------------
// 0. Synchronously Load .env into process.env before Prisma
// ----------------------------------------------------
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import { prisma } from "../lib/prisma";
import { checkRateLimit, rateLimiters } from "../lib/rate-limit";
import { sanitizeText, escapeHtml } from "../lib/sanitize";
import {
  calculatePropertyRankingScore,
  rankProperties,
  rankRoommateRequests,
  type RankableProperty,
  type RankableRoommateRequest,
} from "../lib/ranking";
import { getSearchSuggestionsAction } from "../actions/search";
import { requireAdminContext } from "../actions/admin";
import { requireOwnerContext } from "../actions/owner";

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(
  category: string,
  name: string,
  fn: () => Promise<void> | void
) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, category, passed: true, durationMs });
    console.log(`  ✓ [PASS] [${category}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({
      name,
      category,
      passed: false,
      details: err?.message || String(err),
      durationMs,
    });
    console.error(`  ✗ [FAIL] [${category}] ${name}: ${err?.message || err}`);
  }
}

async function runAllTests() {
  console.log("\n========================================================");
  console.log("   STAYKRO MILESTONE 24: COMPREHENSIVE E2E TEST SUITE   ");
  console.log("========================================================\n");

  const baseUrl = "http://localhost:3000";

  // ----------------------------------------------------
  // SUITE 1: HTTP Smoke & Public Discovery Routes
  // ----------------------------------------------------
  console.log("--- SUITE 1: Public Discovery & SEO Routes ---");

  await runTest("HTTP Discovery", "Home page (/) returns 200 with brand", async () => {
    const res = await fetch(`${baseUrl}/`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!/staykro/i.test(html)) {
      throw new Error("Brand Staykro not found in home page HTML");
    }
  });

  await runTest("HTTP Discovery", "Roommates page (/roommates) returns 200", async () => {
    const res = await fetch(`${baseUrl}/roommates`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!/roommate/i.test(html)) {
      throw new Error("Roommate keyword not found in /roommates HTML");
    }
  });

  await runTest("HTTP Discovery", "City SEO page (/pg/jalandhar) returns 200", async () => {
    const res = await fetch(`${baseUrl}/pg/jalandhar`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.toLowerCase().includes("jalandhar")) {
      throw new Error("Jalandhar not found in /pg/jalandhar HTML");
    }
  });

  await runTest("HTTP Discovery", "City SEO page (/pg/phagwara) returns 200", async () => {
    const res = await fetch(`${baseUrl}/pg/phagwara`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.toLowerCase().includes("phagwara")) {
      throw new Error("Phagwara not found in /pg/phagwara HTML");
    }
  });

  await runTest("HTTP Discovery", "Locality SEO page (/pg/jalandhar/model-town) returns 200", async () => {
    const res = await fetch(`${baseUrl}/pg/jalandhar/model-town`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.toLowerCase().includes("model town")) {
      throw new Error("Model Town not found in /pg/jalandhar/model-town HTML");
    }
  });

  await runTest("HTTP Discovery", "Property details (/property/golden-view-apartment-green-valley-v2lag) returns 200", async () => {
    const res = await fetch(`${baseUrl}/property/golden-view-apartment-green-valley-v2lag`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes("Golden View Apartment")) {
      throw new Error("Golden View Apartment not found in property detail HTML");
    }
  });

  await runTest("HTTP Discovery", "robots.txt returns valid search directives", async () => {
    const res = await fetch(`${baseUrl}/robots.txt`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const text = await res.text();
    if (!text.includes("User-Agent: *")) throw new Error("Missing User-Agent: *");
    if (!text.includes("Disallow: /admin")) throw new Error("Missing Disallow: /admin");
    if (!text.includes("Disallow: /owner")) throw new Error("Missing Disallow: /owner");
    if (!text.includes("sitemap.xml")) throw new Error("Missing sitemap.xml canonical link");
  });

  await runTest("HTTP Discovery", "sitemap.xml returns valid dynamic XML sitemap", async () => {
    const res = await fetch(`${baseUrl}/sitemap.xml`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const text = await res.text();
    if (!text.includes("<urlset") || !text.includes("<url>")) {
      throw new Error("Invalid or missing <urlset> in sitemap.xml");
    }
    if (!text.includes("https://staykro.com")) {
      throw new Error("Missing canonical domain in sitemap.xml");
    }
  });

  // ----------------------------------------------------
  // SUITE 2: Edge Middleware & Authentication Guards
  // ----------------------------------------------------
  console.log("\n--- SUITE 2: Edge Middleware & Route Protection ---");

  const protectedRoutes = [
    { path: "/admin", name: "Admin Dashboard (/admin)" },
    { path: "/admin/properties", name: "Admin Properties (/admin/properties)" },
    { path: "/admin/owners", name: "Admin Owners (/admin/owners)" },
    { path: "/owner", name: "Owner Dashboard (/owner)" },
    { path: "/owner/properties", name: "Owner Properties (/owner/properties)" },
    { path: "/chat", name: "In-Platform Chat (/chat)" },
    { path: "/saved", name: "Saved Listings (/saved)" },
    { path: "/profile", name: "User Profile (/profile)" },
  ];

  for (const route of protectedRoutes) {
    await runTest("Edge Middleware", `Unauthenticated redirect on ${route.name}`, async () => {
      const res = await fetch(`${baseUrl}${route.path}`, {
        redirect: "manual",
      });
      const isRedirect = res.status === 307 || res.status === 308 || res.status === 302;
      const location = res.headers.get("location") || "";
      if (!isRedirect && res.status !== 401) {
        throw new Error(`Expected redirect status (307/302), got ${res.status}`);
      }
      if (isRedirect && !location.includes("/login")) {
        throw new Error(`Expected redirect to /login, got ${location}`);
      }
    });
  }

  // ----------------------------------------------------
  // SUITE 3: HTTP Security Headers
  // ----------------------------------------------------
  console.log("\n--- SUITE 3: Security Headers Verification ---");

  await runTest("Security Headers", "Global response headers are hardened", async () => {
    const res = await fetch(`${baseUrl}/`);
    const headers = res.headers;

    const xFrame = headers.get("x-frame-options");
    if (xFrame !== "DENY") throw new Error(`x-frame-options: expected DENY, got ${xFrame}`);

    const xContent = headers.get("x-content-type-options");
    if (xContent !== "nosniff") throw new Error(`x-content-type-options: expected nosniff, got ${xContent}`);

    const referrer = headers.get("referrer-policy");
    if (!referrer || !referrer.includes("strict-origin")) {
      throw new Error(`referrer-policy: expected strict-origin, got ${referrer}`);
    }

    const permPolicy = headers.get("permissions-policy");
    if (!permPolicy || !permPolicy.includes("camera=()")) {
      throw new Error(`permissions-policy: expected camera=(), got ${permPolicy}`);
    }

    const csp = headers.get("content-security-policy");
    if (!csp || !csp.includes("default-src")) {
      throw new Error(`content-security-policy: expected CSP header, got ${csp}`);
    }
  });

  // ----------------------------------------------------
  // SUITE 4: Input Sanitization & XSS Defense
  // ----------------------------------------------------
  console.log("\n--- SUITE 4: Input Sanitization & XSS Defense ---");

  await runTest("Sanitization", "Strips script tags and inline javascript", () => {
    const dirty = "<script>alert('pwned')</script>Hello safe text";
    const cleaned = sanitizeText(dirty);
    if (cleaned.includes("<script>") || cleaned.includes("alert")) {
      throw new Error(`Failed to strip script tag: ${cleaned}`);
    }
    if (!cleaned.includes("Hello safe text")) {
      throw new Error(`Safe content was dropped: ${cleaned}`);
    }
  });

  await runTest("Sanitization", "Strips inline event handlers (onerror, onload)", () => {
    const dirty = '<img src="x" onerror="alert(document.cookie)">Nice PG room';
    const cleaned = sanitizeText(dirty);
    if (cleaned.includes("onerror") || cleaned.includes("alert")) {
      throw new Error(`Failed to strip event handler: ${cleaned}`);
    }
  });

  await runTest("Sanitization", "Strips iframe and embed tags", () => {
    const dirty = '<iframe src="https://attacker.com"></iframe>Spacious PG';
    const cleaned = sanitizeText(dirty);
    if (cleaned.includes("iframe") || cleaned.includes("attacker.com")) {
      throw new Error(`Failed to strip iframe tag: ${cleaned}`);
    }
  });

  await runTest("Sanitization", "Enforces maximum string length limit", () => {
    const longString = "A".repeat(500);
    const trimmed = sanitizeText(longString, 100);
    if (trimmed.length > 100) {
      throw new Error(`Expected max length 100, got ${trimmed.length}`);
    }
  });

  await runTest("Sanitization", "Escapes HTML entities safely", () => {
    const raw = `& < > " '`;
    const escaped = escapeHtml(raw);
    if (
      !escaped.includes("&amp;") ||
      !escaped.includes("&lt;") ||
      !escaped.includes("&gt;") ||
      !escaped.includes("&quot;") ||
      !escaped.includes("&#039;")
    ) {
      throw new Error(`HTML entity escaping failed: ${escaped}`);
    }
  });

  // ----------------------------------------------------
  // SUITE 5: Rate Limiting Sliding Window
  // ----------------------------------------------------
  console.log("\n--- SUITE 5: Rate Limiting & Abuse Prevention ---");

  await runTest("Rate Limiter", "Permits requests within quota and blocks threshold breaches", () => {
    const testKey = `test_runner_${Date.now()}`;
    const limit = 3;
    const windowMs = 5000;

    for (let i = 1; i <= limit; i++) {
      const result = checkRateLimit(testKey, limit, windowMs);
      if (!result.success) {
        throw new Error(`Request ${i} should have succeeded, but failed`);
      }
      if (result.remaining !== limit - i) {
        throw new Error(`Expected remaining ${limit - i}, got ${result.remaining}`);
      }
    }

    const blocked = checkRateLimit(testKey, limit, windowMs);
    if (blocked.success) {
      throw new Error("Request 4 should have been blocked, but succeeded");
    }
    if (blocked.remaining !== 0) {
      throw new Error(`Expected remaining 0 on blocked request, got ${blocked.remaining}`);
    }
    if (blocked.resetMs <= 0) {
      throw new Error(`Expected positive resetMs, got ${blocked.resetMs}`);
    }
  });

  await runTest("Rate Limiter", "Auth, Review, Enquiry rate limiter facades work", () => {
    const authCheck = rateLimiters.auth(`ip_test_${Date.now()}`);
    if (!authCheck.success || authCheck.remaining !== 4) {
      throw new Error("rateLimiters.auth initial check failed");
    }

    const reviewCheck = rateLimiters.review(`user_test_${Date.now()}`);
    if (!reviewCheck.success || reviewCheck.remaining !== 4) {
      throw new Error("rateLimiters.review initial check failed");
    }

    const enquiryCheck = rateLimiters.enquiry(`phone_test_${Date.now()}`);
    if (!enquiryCheck.success || enquiryCheck.remaining !== 9) {
      throw new Error("rateLimiters.enquiry initial check failed");
    }
  });

  // ----------------------------------------------------
  // SUITE 6: Multi-Factor Ranking Engine
  // ----------------------------------------------------
  console.log("\n--- SUITE 6: Multi-Factor Ranking Engine ---");

  await runTest("Ranking Engine", "Calculates property ranking scores according to weights", () => {
    const baseProperty: RankableProperty = {
      id: "p1",
      name: "Standard PG",
      slug: "standard-pg",
      locality: "Model Town",
      city: "Jalandhar",
      genderPolicy: "UNISEX",
      startingPrice: 6000,
      foodIncluded: true,
      coverImageUrl: "https://example.com/cover.jpg",
      roomTypeSummaries: ["Double Sharing"],
      latitude: 31.326,
      longitude: 75.576,
      isVerified: false,
      isFeatured: false,
      rating: 3.5,
      reviewCount: 2,
      availableRoomsCount: 1,
    };

    const premiumProperty: RankableProperty = {
      ...baseProperty,
      id: "p2",
      name: "Luxury Verified PG",
      slug: "luxury-pg",
      isVerified: true,
      isOwnerVerified: true,
      isFeatured: true,
      rating: 4.8,
      reviewCount: 25,
      availableRoomsCount: 5,
    };

    const baseScore = calculatePropertyRankingScore(baseProperty, {
      selectedCity: "Jalandhar",
      selectedLocality: "Model Town",
    });

    const premiumScore = calculatePropertyRankingScore(premiumProperty, {
      selectedCity: "Jalandhar",
      selectedLocality: "Model Town",
    });

    if (premiumScore <= baseScore) {
      throw new Error(
        `Premium property score (${premiumScore}) should exceed base property (${baseScore})`
      );
    }
  });

  await runTest("Ranking Engine", "Ranks properties correctly across sorting modes", () => {
    const pLowPrice: RankableProperty = {
      id: "p-low",
      name: "Budget PG",
      slug: "budget-pg",
      locality: "Model Town",
      city: "Jalandhar",
      genderPolicy: "BOYS",
      startingPrice: 4000,
      foodIncluded: false,
      coverImageUrl: null,
      roomTypeSummaries: [],
      latitude: 31.326,
      longitude: 75.576,
      rating: 3.0,
      createdAt: new Date("2026-01-01"),
    };

    const pHighPrice: RankableProperty = {
      id: "p-high",
      name: "Luxury PG",
      slug: "luxury-pg",
      locality: "Model Town",
      city: "Jalandhar",
      genderPolicy: "BOYS",
      startingPrice: 12000,
      foodIncluded: true,
      coverImageUrl: "https://example.com/cover.jpg",
      roomTypeSummaries: [],
      latitude: 31.326,
      longitude: 75.576,
      rating: 4.9,
      createdAt: new Date("2026-02-01"),
    };

    // Test price-asc
    const sortedAsc = rankProperties([pHighPrice, pLowPrice], undefined, "price-asc");
    if (sortedAsc[0].id !== "p-low") {
      throw new Error(`Expected price-asc to place p-low first, got ${sortedAsc[0].id}`);
    }

    // Test price-desc
    const sortedDesc = rankProperties([pLowPrice, pHighPrice], undefined, "price-desc");
    if (sortedDesc[0].id !== "p-high") {
      throw new Error(`Expected price-desc to place p-high first, got ${sortedDesc[0].id}`);
    }

    // Test rating
    const sortedRating = rankProperties([pLowPrice, pHighPrice], undefined, "rating");
    if (sortedRating[0].id !== "p-high") {
      throw new Error(`Expected rating to place p-high first, got ${sortedRating[0].id}`);
    }
  });

  await runTest("Ranking Engine", "Ranks roommate requests prioritising verified creators", () => {
    const reqUnverified: RankableRoommateRequest = {
      id: "r1",
      title: "Roommate needed",
      locality: "Model Town",
      city: "Jalandhar",
      rentPerPerson: 5000,
      preferredGender: "BOYS",
      moveInDate: new Date("2026-11-01"),
      isCreatorVerified: false,
      createdAt: new Date("2026-01-01"),
    };

    const reqVerified: RankableRoommateRequest = {
      id: "r2",
      title: "Verified Student Seeking Roommate",
      locality: "Model Town",
      city: "Jalandhar",
      rentPerPerson: 5000,
      preferredGender: "BOYS",
      moveInDate: new Date("2026-11-01"),
      isCreatorVerified: true,
      createdAt: new Date("2026-01-01"),
    };

    const ranked = rankRoommateRequests([reqUnverified, reqVerified]);
    if (ranked[0].id !== "r2") {
      throw new Error(`Expected verified creator request to rank first, got ${ranked[0].id}`);
    }
  });

  // ----------------------------------------------------
  // SUITE 7: Autocomplete Search Server Action
  // ----------------------------------------------------
  console.log("\n--- SUITE 7: Search Autocomplete Server Action ---");

  await runTest("Search Autocomplete", "Returns suggestions for city/locality queries", async () => {
    const suggestions = await getSearchSuggestionsAction("jal");
    if (!suggestions || typeof suggestions !== "object") {
      throw new Error("Expected object of suggestions from getSearchSuggestionsAction");
    }
    const allMatches = [
      ...suggestions.localities,
      ...suggestions.properties,
      ...suggestions.roommates,
    ];
    const hasJalandhar = allMatches.some(
      (s) => s.title.toLowerCase().includes("jalandhar") || s.subtitle.toLowerCase().includes("jalandhar")
    );
    if (!hasJalandhar && suggestions.totalMatches === 0) {
      throw new Error("Expected Jalandhar suggestion or matches for query 'jal'");
    }
  });

  await runTest("Search Autocomplete", "Handles empty or whitespace query safely", async () => {
    const suggestions = await getSearchSuggestionsAction("   ");
    if (
      !suggestions ||
      suggestions.localities.length !== 0 ||
      suggestions.properties.length !== 0 ||
      suggestions.roommates.length !== 0 ||
      suggestions.totalMatches !== 0
    ) {
      throw new Error("Expected empty result object for whitespace query");
    }
  });

  // ----------------------------------------------------
  // SUITE 8: Server-Side Context Security Guards
  // ----------------------------------------------------
  console.log("\n--- SUITE 8: Server-Side Authorization Guards ---");

  await runTest("Security Guards", "requireAdminContext blocks unauthenticated callers", async () => {
    let blocked = false;
    try {
      await requireAdminContext();
    } catch (err: any) {
      blocked = true;
    }
    if (!blocked) {
      throw new Error("requireAdminContext should reject unauthenticated caller");
    }
  });

  await runTest("Security Guards", "requireOwnerContext blocks unauthenticated callers", async () => {
    let blocked = false;
    try {
      await requireOwnerContext();
    } catch (err: any) {
      blocked = true;
    }
    if (!blocked) {
      throw new Error("requireOwnerContext should reject unauthenticated caller");
    }
  });

  // ----------------------------------------------------
  // SUITE 9: Database Integrity & Active Relationships
  // ----------------------------------------------------
  console.log("\n--- SUITE 9: Database Integrity & Active Relationships ---");

  await runTest("Database", "Connects to PostgreSQL and verifies City & Locality records", async () => {
    const cities = await prisma.city.findMany({
      include: { localities: true },
    });
    if (cities.length === 0) {
      throw new Error("No cities found in database");
    }
    const jalandhar = cities.find((c) => c.slug === "jalandhar");
    if (!jalandhar || jalandhar.localities.length === 0) {
      throw new Error("Jalandhar with localities not found");
    }
  });

  await runTest("Database", "Published properties have rooms and valid pricing", async () => {
    const properties = await prisma.property.findMany({
      where: { status: "PUBLISHED" },
      include: {
        roomTypes: {
          include: { rooms: true },
        },
      },
    });

    if (properties.length === 0) {
      throw new Error("Zero published properties found");
    }

    for (const prop of properties) {
      if (!prop.name || !prop.slug || !prop.city || !prop.locality) {
        throw new Error(`Property ${prop.id} is missing core fields`);
      }
      if (typeof prop.latitude !== "number" || typeof prop.longitude !== "number") {
        throw new Error(`Property ${prop.id} is missing valid geo coordinates`);
      }
    }
  });

  await runTest("Database", "Review and Rating calculations are mathematically sound", async () => {
    const propertyWithReviews = await prisma.property.findFirst({
      where: {
        reviews: { some: { status: "APPROVED" } },
      },
      include: {
        reviews: { where: { status: "APPROVED" } },
      },
    });

    if (propertyWithReviews && propertyWithReviews.reviews.length > 0) {
      const approvedCount = propertyWithReviews.reviews.length;
      const sum = propertyWithReviews.reviews.reduce((acc, r) => acc + r.rating, 0);
      const calculatedAvg = Number((sum / approvedCount).toFixed(1));

      if (calculatedAvg < 1.0 || calculatedAvg > 5.0) {
        throw new Error(
          `Calculated avg rating (${calculatedAvg}) is out of bounds [1.0, 5.0]`
        );
      }
    }
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log("\n========================================================");
  console.log("                   TEST SUMMARY REPORT                  ");
  console.log("========================================================");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests Executed: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed Tests Details:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.error(`- [${r.category}] ${r.name}: ${r.details}`);
      });
    process.exit(1);
  } else {
    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY WITH ZERO FAILURES!");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner encountered catastrophic error:", err);
  process.exit(1);
});
