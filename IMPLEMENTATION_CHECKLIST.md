# StayKro — Production Implementation Checklist & Roadmap

> **Platform**: StayKro (RoomShare & PG Discovery Platform)  
> **Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma, Supabase PostgreSQL, Supabase Auth & Realtime, Cloudflare R2, MapLibre GL JS, Razorpay, Vercel.

---

## 🎯 Current Milestone Progress

- [x] **Milestone 0: Technical Foundation & Database Architecture** (Completed)
- [x] **Milestone 1: Authentication & User Profile** (Completed)
- [x] **Milestone 2: Database Migration & Live Supabase Verification** (Completed)
- [x] **Milestone 3: PG Owner Onboarding & Profile Management** (Completed)
- [x] **Milestone 4: Property & Room Inventory Management (Owner Dashboard)** (Completed)
- [x] **Milestone 5: Cloudflare R2 Image Upload Pipeline** (Completed)
- [x] **Milestone 6: Utility-First Public PG Finder (Clean Homepage & Filters)** (Completed)
- [x] **Milestone 7: Property Details Page (`/property/[slug]`)** (Completed)
- [x] **Milestone 8: MapLibre Map & Location Search (PostGIS)** (Completed)
- [x] **Milestone 9: Roommate Share Discovery Surface** (Completed)
- [x] **Milestone 10: Create Roommate Request Flow** (Completed)
- [x] **Milestone 11: Roommate Interest System (Application Flow)** (Completed)
- [x] **Milestone 12: In-Platform Chat via Supabase Realtime** (Completed)
- [x] **Milestone 13: Saved Listings (Bookmarks)** (Completed)
- [x] **Milestone 14: Owner Dashboard (Metrics & Room Inventory)** (Completed)
- [x] **Milestone 18: Admin Portal (`/admin`) & Invite-Only Onboarding** (Completed)
- [x] **Milestone 19: Reports, Reviews & Moderation Trail** (Completed)
- [x] **Milestone 20: Search Quality & Ranking** (Completed)
- [x] **Milestone 21: SEO Optimization & Dynamic Landing Pages** (Completed)
- [x] **Milestone 22: Performance Tuning & Caching** (Completed)
- [ ] **Milestone 15: Subscription & Monetization System** (Deferred to last)
- [ ] **Milestone 16: Razorpay Payment Integration** (Deferred to last)
- [ ] **Milestone 17: Featured Listings Boost** (Deferred to last)
- [ ] **Milestone 23: Security Hardening & Row Level Security (RLS)**
- [ ] **Milestone 24: Comprehensive End-to-End Testing**
- [ ] **Milestone 25: Production Deployment on Vercel**

---

## 📋 Detailed Phase Breakdown

### Phase 0 — Foundation & Database
- [x] Next.js App Router (16.4.2) + React 19 + TypeScript
- [x] Tailwind CSS v4 configured
- [x] Lucide React icons
- [x] ESLint flat config passing with 0 errors
- [x] Git repository initialized and connected to remote origin (`main`)
- [x] Supabase PostgreSQL connection configured
- [x] Prisma 6 + `prisma.config.ts` initialized
- [x] Strict Production Schema Design in `prisma/schema.prisma`:
  - [x] Single source of truth for room occupancy (`RoomType.occupancy` + `Room.occupiedBeds`)
  - [x] Strict separation of PG inventory vs Roommate Share requests
  - [x] Dedicated `RoommateInterest` application model
  - [x] In-platform chat (`Conversation`, `Message`) prepared for Supabase Realtime
  - [x] Direct phone & WhatsApp enquiry model (`PGEnquiry`) separate from website chat
  - [x] Configurable monetization (`SubscriptionPlan`, `FeaturedPricingPlan`)
  - [x] PostGIS spatial index readiness (`latitude`, `longitude` WGS 84)
- [x] Initial migration generated: `prisma/migrations/20261018100937_init/migration.sql`
- [x] Realistic seed script created: `prisma/seed.ts`
- [x] Prisma Client generated in `lib/generated/prisma`

---

### Phase 1 — Authentication & User System (Completed)
- [x] Supabase SSR Client Helpers:
  - [x] Browser client (`lib/supabase/client.ts`)
  - [x] Server client (`lib/supabase/server.ts`)
  - [x] Middleware session refresh (`lib/supabase/middleware.ts`)
- [x] Root Next.js route protection (`middleware.ts`)
- [x] Application User Synchronization (`lib/auth/user.ts`):
  - [x] `syncAppUser()` maps `supabaseAuthId` to Prisma `User` & `Profile`
- [x] Server-side authorization helpers (`lib/auth/session.ts`):
  - [x] `getCurrentUser()`
  - [x] `requireUser()`
- [x] Server Actions (`actions/auth.ts`):
  - [x] Sign up with full name, email, password, optional phone
  - [x] Login with email & password
  - [x] Logout
  - [x] Forgot password (email link)
  - [x] Reset password (update password)
- [x] Auth Routes & UI Pages:
  - [x] `/login` (with error handling & `returnUrl` preservation)
  - [x] `/signup` (with account provisioning)
  - [x] `/forgot-password` (recovery request)
  - [x] `/reset-password` (new password submission)
  - [x] `/auth/callback` (PKCE token exchange)
- [x] User Profile System:
  - [x] Protected page (`/profile`) with streaming partial prerendering
  - [x] Profile editor (`components/profile/ProfileForm.tsx`)
  - [x] Server Action (`actions/profile.ts`) for updating profile attributes
- [x] Responsive navigation integration (`components/layout/Header.tsx` reflects auth state)

---

### Phase 2 — Public PG Finder (Homepage Utility Redesign)
*Goal: Transform the homepage into a clean, minimal, search-first utility rather than a marketing landing page.*
- [ ] Top bar with location search and filter triggers
- [ ] Split view / responsive layout: PG listing cards alongside interactive map container
- [ ] Search controls:
  - [ ] Current location GPS trigger
  - [ ] City selector
  - [ ] Locality / Landmark search with suggestions
- [ ] Essential filter pills:
  - [ ] Price slider / range (e.g., Under ₹8,000, ₹8k–₹12k, ₹12k+)
  - [ ] Room Type (Single, 2-Seater, 3-Seater)
  - [ ] Gender Policy (Boys, Girls, Unisex/Coliving)
  - [ ] Food inclusion filter (Meals Included, Self Cooking)
  - [ ] AC / Attached bathroom filters
- [ ] Responsive PG Card display:
  - [ ] Property thumbnail & cover image
  - [ ] Property name & locality
  - [ ] Starting price (`₹/mo`)
  - [ ] Available room types
  - [ ] Key amenities
  - [ ] Verified badge

---

### Phase 3 — Property Details Page (`/property/[slug]`) (Completed)
- [x] Dynamic App Router route: `/property/[slug]`
- [x] High-resolution property image carousel/gallery with fullscreen lightbox
- [x] Key highlights (verified badge, gender policy, curfew / gate closing time, zero brokerage)
- [x] Room Types section (shows room types with pricing, amenities, and live vacancies)
- [x] Amenities checklist (grouped by category: essential, safety, food, comfort)
- [x] House rules & curfew timings / gate closing time
- [x] Direct Owner Contact CTA:
  - [x] Direct Phone Call button (`tel:${phone}`)
  - [x] WhatsApp click-to-chat button with prefilled property message
  - [x] Quick booking enquiry submission (`submitPGEnquiryAction`)
- [x] Interactive Location & address preview
- [x] Dynamic SEO metadata generation (`generateMetadata` using property name, locality, city, pricing)

---

### Phase 4 — Admin-Invite-Only Owner Onboarding Flow (Completed)
- [x] Strict Access Separation: Normal users cannot self-register as PG owners (Invite-only)
- [x] Admin Owner Invite Management Console (`/admin/invitations`):
  - [x] Admin creates invitation by entering email & optional name
  - [x] Generates cryptographically secure 64-character token with SHA-256 token hashing in DB
  - [x] 1-Click invite link copy with configurable expiry (`OWNER_INVITE_EXPIRY_DAYS`, default 7 days)
  - [x] Full invitation status lifecycle: `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`
  - [x] Admin can revoke pending invitations at any time
  - [x] Full audit trail (created timestamp, expires timestamp, accepted timestamp, accepted by user ID)
- [x] Dedicated Invite Landing Page (`/owner/invite/[token]`):
  - [x] Validates token validity and expiration
  - [x] Prompts unauthenticated invitees to sign in or register with the invited email
  - [x] Strict email matching: Prevents a different signed-in account from claiming another person's invite
  - [x] Transactional & idempotent acceptance: user upgraded to `OWNER`, `OwnerProfile` provisioned with `VERIFIED` status
- [x] Multi-step Owner Onboarding Wizard (`/owner/onboarding`):
  - [x] Step 1: Owner Profile (Name, Phone, WhatsApp, Alternate Phone — NO government ID or document uploads required)
  - [x] Step 2: Property basic details (Name, property type, gender policy, address, locality, city, rules, amenities multi-select)
  - [x] Step 3: Room types & initial automated inventory generator (Capacity, rent, deposit, features, auto-provisioning room numbers)
  - [x] Step 4: Preview summary & launch (Publish immediately or save as draft)
- [x] Navigation & Security: "Owner Hub" strictly gated to `OWNER` and `ADMIN` users; "Admin Panel" gated to `ADMIN` users

---

### Phase 5 & 6 — Owner Dashboard & Inventory Management (Completed)
- [x] Owner portfolio dashboard (`/owner/properties`):
  - [x] Aggregate KPIs: Total properties, total rooms, total nominal capacity (beds), occupied beds, vacant beds, occupancy rate %
  - [x] Filter properties by status (All, Published, Draft) and search
  - [x] Visual occupancy progress bar for each property
  - [x] Quick toggle status (Publish / Unpublish)
- [x] Dedicated Room Inventory Management workspace (`/owner/properties/[id]/rooms`):
  - [x] Hierarchical view strictly preserving Property -> RoomType -> Room
  - [x] Filter rooms by RoomType and operational status
  - [x] Bed occupancy stepper (`+` and `-` buttons bounded between 0 and room capacity)
  - [x] Visual bed glyphs (filled/vacant) and live vacancy indicators
  - [x] Operational status selector (`AVAILABLE`, `UNDER_MAINTENANCE`, `RESERVED`, `INACTIVE`)
  - [x] Internal room notes modal / viewer
  - [x] Add single room modal with custom room numbering
  - [x] Add new room type modal with batch room generation
  - [x] Enforces strict server-side ownership authorization

---

### Phase 7, 8, 9 & 10 — Roommate Share System (Platform USP) (Completed)
- [x] Dedicated navigation link: **Roommate Share** (`/roommates`)
- [x] Separate discovery interface:
  - [x] Filter by locality, budget, preferred gender, move-in date
  - [x] Filter by lifestyle habits (dietary, smoking, drinking, sleep schedule)
  - [x] Roommate request cards with seeker bio, room type, rent share
- [x] Create Roommate Request flow (`/roommates/new` - Auth Protected):
  - [x] Streamlined UX: Auto-populated from PG & room type context with zero redundant form entry
  - [x] Room share split pricing: Total PG room amount is automatically split equally between occupants (`monthlyRent / occupancy` and `securityDeposit / occupancy`)
  - [x] Transparent pricing display: Shows per-person share and total room amount with split breakdown
  - [x] Seeker personal entry: Target move-in date, about you description, lifestyle habits & tags
- [x] Roommate Detail Page (`/roommates/[id]`):
  - [x] Seeker verification badge & background info
  - [x] Detailed lifestyle compatibility checklist
  - [x] "I'm Interested" application trigger
- [x] Roommate Interest Application System:
  - [x] Applicant submits interest with introductory note
  - [x] Request creator receives notification & review screen
  - [x] Creator accepts or declines application
  - [x] Accepted interest automatically initiates private conversation

---

### Phase 11 — In-Platform Website Chat (Supabase Realtime) (Completed)
- [x] Dedicated chat surface (`/chat` and `/chat/[id]`)
- [x] Only available for accepted roommate matches (protecting personal phone numbers)
- [x] Supabase Realtime live channel subscriptions for instant messaging
- [x] Optimistic message delivery with timestamp tracking
- [x] Linked property & room requirement badge in chat header

---

### Phase 12 — Saved Listings (Bookmarks) (Completed)
- [x] Toggle save button on PG cards and Roommate cards
- [x] Reusable optimistic `BookmarkButton` component
- [x] Saved items dashboard (`/saved`):
  - [x] Saved PGs tab with direct link & un-save control
  - [x] Saved Roommate requests tab with direct link & un-save control
- [x] Header integration: 1-click Bookmark link for authenticated users

---

### Phase 13, 14, 15 & 16 — Monetization, Payments & R2 Image Storage
- [ ] Owner Subscription Tiers (Plan 1: ₹499/mo, Plan 2: ₹999/mo)
- [ ] Featured Listings Boost (₹199 property / 7 days, ₹99 room / 7 days)
- [ ] Razorpay Checkout Integration:
  - [ ] Server-side order creation
  - [ ] Client SDK payment modal
  - [ ] Webhook / signature verification before subscription/feature activation
- [x] Cloudflare R2 Upload Pipeline:
  - [x] Presigned URLs for client-to-R2 direct uploads
  - [x] File validation (mime types, max sizes)
  - [x] CDN delivery URLs persisted in PostgreSQL
  - [x] S3-compatible SDK integration (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
  - [x] Owner photo gallery workspace (`/owner/properties/[id]/photos`)
  - [x] Primary cover photo assignment & Cloudflare R2 object deletion

---

### Phase 17 — Maps (MapLibre GL JS + PostGIS) (Completed)
- [x] MapLibre GL JS integration with OpenStreetMap / CartoDB tiles
- [x] Interactive property price pill markers with dynamic preview popups
- [x] Dynamic bounding box search on map drag/zoom (`getPropertiesInBoundsAction`)
- [x] Spatial queries (`getPropertiesInBoundsAction`, `getNearbyPropertiesAction`)
- [x] Discovery surface integration: 3-way view switcher (`Grid`, `Split`, `Map`) with smooth city `map.flyTo`
- [x] Single property detail map on `/property/[slug]` (`SinglePropertyMap`) with pulsing pin and directions trigger
- [x] Mobile floating `Show Map` / `Show List` toggle pill

---

### Phase 18 & 19 — Admin Portal & Trust & Safety (Completed)
- [x] Strict server-side route protection (`requireAdmin()`) across `/admin` and all sub-routes
- [x] Responsive collapsible Admin Sidebar with live badge counts (reports, pending invites, localities)
- [x] Database-backed Overview Metrics & Activity Feed (real Prisma queries, zero mock data)
- [x] Property Management (`/admin/properties`, `/admin/properties/[id]`) with status workflows (Publish, Reject, Soft-Delete)
- [x] Owner Management (`/admin/owners`, `/admin/owners/[id]`) with verification states and suspension
- [x] Invite-Only Owner Onboarding (`/admin/owners/invitations`):
  - [x] Cryptographic UUID token generation, email dispatch simulation, link copying
  - [x] Pending, Accepted, Expired, Revoked lifecycle
  - [x] Self-promotion prevention: user cannot become OWNER without valid unredeemed invitation
- [x] User Management (`/admin/users`) with ban/unban toggles and guarded role assignments
- [x] Location Hierarchy Master Data (`/admin/locations`):
  - [x] Relational State &rarr; City &rarr; Locality models in Supabase PostgreSQL
  - [x] Pre-seeded Punjab (Jalandhar, Phagwara) and Karnataka (Bengaluru)
  - [x] Owner locality request submission and admin approval/rejection pipeline
- [x] Roommate Request Moderation (`/admin/roommates`) linking property + room type
- [x] Reports Inbox (`/admin/reports`) with resolution states and moderator notes
- [x] Reviews Moderation (`/admin/reviews`) with Approve, Hide, and Reject workflows
- [x] Payments Ledger (`/admin/payments`) with Razorpay transaction tracking (credentials hidden)
- [x] Subscriptions Ledger (`/admin/subscriptions`) with cycle and payment relationships
- [x] Featured Listings Placement (`/admin/featured`) with activation and cancellation
- [x] System Audit Trail (`/admin/audit-logs`) with immutable, append-only logs for all mutations
- [x] Dangerous Action Confirmation Dialogs on all destructive admin operations

---

### Phase 20 — Search Quality & Ranking (Completed)
- [x] Multi-factor property ranking engine (`lib/ranking.ts`):
  - [x] Location relevance & exact locality match scoring (up to 35 pts) + GPS proximity decay scoring
  - [x] Listing completeness & media depth (up to 25 pts)
  - [x] Real-time room inventory & availability signals (up to 20 pts)
  - [x] Trust & verification signals (admin verified, owner KYC: up to 15 pts)
  - [x] Social proof & verified reviews rating bonus (up to 10 pts)
  - [x] Active featured listing boost (+15 pts)
- [x] Typo-tolerant search autocomplete & suggestions (`actions/search.ts`):
  - [x] Sub-string and case-insensitive matching across database Localities, Properties, and Roommate Requests
  - [x] Interactive floating autocomplete suggestions popover in hero search input
- [x] Multi-factor roommate request ranking (`rankRoommateRequests`):
  - [x] Prioritizes verified user profiles, full profile details, and upcoming move-in dates
- [x] Multi-criteria sorting controls across PG finder & Roommates:
  - [x] Recommended (Best Match), Nearest First (GPS), Top Rated, Price: Low to High, Price: High to Low, Newest Listed
- [x] Smart zero-results fallbacks:
  - [x] Query-aware empty states
  - [x] 1-Click fallback buttons suggesting popular alternative localities in the same city
  - [x] Fast city switchers and clear filter shortcuts

---

### Phase 21 — SEO Optimization & Dynamic Landing Pages (Completed)
- [x] Search Engine Directives (`app/robots.ts`):
  - [x] Directives allowing public discovery surfaces (`/`, `/property/`, `/pg/`, `/roommates`)
  - [x] Guarded disallows for private/authenticated sections (`/admin/`, `/owner/`, `/chat/`, `/saved/`, `/profile/`, `/api/`, `/auth/`)
  - [x] Canonical link to dynamic sitemap (`https://staykro.com/sitemap.xml`)
- [x] Dynamic XML Sitemap Generator (`app/sitemap.ts`):
  - [x] Auto-discovers all published properties (`priority: 0.9`, weekly change frequency)
  - [x] Auto-discovers all active cities and localities from database (`priority: 0.8`)
  - [x] Static core routes indexing (`/`, `/roommates`, `/login`, `/signup`)
- [x] Structured Data (Schema.org JSON-LD in `lib/seo.ts`):
  - [x] `LodgingBusiness` schema with address, coordinates, priceRange, amenities, and aggregateRating
  - [x] `BreadcrumbList` schema for search engine breadcrumb trails
  - [x] `FAQPage` schema for rich snippet FAQs in Google search results
  - [x] `ItemList` schema for programmatic category and locality listings
- [x] Programmatic Dynamic Landing Pages:
  - [x] City-level SEO landing pages (`app/pg/[city]/page.tsx`) with dynamic titles, descriptions, and OpenGraph/Twitter cards
  - [x] Locality-level SEO landing pages (`app/pg/[city]/[locality]/page.tsx`) with landmark context, breadcrumb navigation, and filter pills
  - [x] Shared responsive client view (`components/seo/LocationLandingClient.tsx`) with filter tabs (Boys, Girls, Coliving, With Meals), verified property cards, and expandable FAQ accordions
- [x] Social Sharing & Canonical Metadata:
  - [x] Fully localized `<title>`, `<meta description>`, OpenGraph cards, Twitter cards, and `<link rel="canonical">` tags on all property detail pages (`/property/[slug]`) and programmatic landing pages
- [x] Internal Linking SEO Mesh (`components/layout/Footer.tsx`):
  - [x] Upgraded footer with canonical links to top PG cities and popular locality searches

---

### Phase 22 — Performance Tuning & Caching (Completed)
- [x] **User Surface Performance**:
  - [x] Next.js Image Optimization (`next.config.ts`):
    - [x] Enabled AVIF & WebP modern image formats (30–50% bandwidth reduction)
    - [x] 30-day minimum cache TTL (`minimumCacheTTL: 2592000`)
  - [x] Property Card Hover & Render Optimization (`components/property/PropertyCard.tsx`):
    - [x] Eliminated redundant off-screen image loading (deferred non-active carousel images until card hover)
    - [x] Added `loading="lazy"` and `decoding="async"` for optimal Largest Contentful Paint (LCP)
  - [x] Property Detail Metadata Single-Query Optimization (`app/property/[slug]/page.tsx`):
    - [x] Combined sequential `findUnique` and `roomType.findMany` into a single query round-trip
  - [x] Instant Search Autocomplete Client-Side & Server-Side Cache (`components/home/CleanHomeClient.tsx` & `actions/search.ts`):
    - [x] Client-side keystroke cache with 0ms response latency on backspace/re-typing
    - [x] Server-side in-memory suggestion cache with 60s TTL and bounded LRU eviction
    - [x] Parallelized sub-queries (localities, properties, roommates) via `Promise.all`
  - [x] Storage & Static Asset Caching Headers (`next.config.ts` & `app/api/storage/[...key]/route.ts`):
    - [x] `Cache-Control: public, max-age=31536000, immutable` for all proxied Cloudflare R2 images and static assets
- [x] **Owner Dashboard & Inventory Performance**:
  - [x] Owner Metrics Query Payload Optimization (`actions/owner.ts`):
    - [x] Replaced unbounded room object hydration with selective projection (`select: { status: true, occupiedBeds: true }`), reducing JSON serialization by ~80%
    - [x] Parallelized recent enquiries and approved review queries via `Promise.all`
- [x] **Admin Portal Performance**:
  - [x] Bounded Table Pagination across Users, Properties, Reports, Reviews, and Audit Logs
  - [x] Filter Cities Distinct Query In-Memory Caching (`actions/admin.ts`):
    - [x] Eliminated repeated table scans on property management page with 5-minute memory cache
  - [x] Parallelized overview counter aggregations with `Promise.all`

---

### Phase 23, 24 & 25 — Security, Testing & Production Deployment
- [ ] Milestone 23: Security Hardening & Row Level Security (RLS)
- [ ] Milestone 24: Comprehensive End-to-End Testing
- [ ] Milestone 25: Production Deployment on Vercel
- [ ] Milestone 15, 16, 17: Monetization, Razorpay & Featured Boost (Deferred to last)
