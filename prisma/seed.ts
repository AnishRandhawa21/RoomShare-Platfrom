import {
  PrismaClient,
  Role,
  VerificationStatus,
  PropertyType,
  GenderPolicy,
  PropertyStatus,
  FoodOffering,
  RoomOperationalStatus,
  RoommateRequestStatus,
  DietaryPreference,
  SmokingPreference,
  DrinkingPreference,
  OccupationPreference,
  SleepSchedule,
  FeaturedTargetType,
} from "../lib/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting StayKro database seed...");

  // 1. Seed Catalog Amenities
  console.log("1. Seeding Amenities...");
  const amenitiesData = [
    { name: "High-Speed WiFi", category: "ESSENTIAL", icon: "Wifi" },
    { name: "Power Backup", category: "ESSENTIAL", icon: "Zap" },
    { name: "Daily Housekeeping", category: "ESSENTIAL", icon: "Sparkles" },
    { name: "RO Drinking Water", category: "ESSENTIAL", icon: "Droplets" },
    { name: "Attached Washroom", category: "COMFORT", icon: "Bath" },
    { name: "Air Conditioning", category: "COMFORT", icon: "Wind" },
    { name: "Washing Machine", category: "COMFORT", icon: "Shirt" },
    { name: "Geyser / Hot Water", category: "COMFORT", icon: "Flame" },
    { name: "Gym & Fitness Zone", category: "COMFORT", icon: "Dumbbell" },
    { name: "Refrigerator", category: "COMFORT", icon: "Refrigerator" },
    { name: "Balcony", category: "COMFORT", icon: "Sun" },
    { name: "CCTV Surveillance", category: "SAFETY", icon: "Shield" },
    { name: "Biometric Access", category: "SAFETY", icon: "Fingerprint" },
    { name: "3 Meals Included", category: "FOOD", icon: "Utensils" },
  ];

  for (const item of amenitiesData) {
    await prisma.amenity.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  // 2. Seed Subscription Plans & Featured Pricing Plans (Configurable DB rows, not hardcoded logic)
  console.log("2. Seeding Subscription & Feature Plans...");
  await prisma.subscriptionPlan.upsert({
    where: { code: "OWNER_SINGLE_PROPERTY" },
    update: { priceInr: 499, maxProperties: 1 },
    create: {
      name: "Starter Owner (Single Property)",
      code: "OWNER_SINGLE_PROPERTY",
      priceInr: 499,
      maxProperties: 1,
      features: [
        "1 Verified PG Property Listing",
        "Direct Phone & WhatsApp Enquiry Leads",
        "Unlimited Room & Inventory Management",
        "Basic Search Visibility",
      ],
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: "OWNER_MULTI_PROPERTY" },
    update: { priceInr: 999, maxProperties: 999 },
    create: {
      name: "Pro Owner (Multi-Property)",
      code: "OWNER_MULTI_PROPERTY",
      priceInr: 999,
      maxProperties: 999,
      features: [
        "Multiple PG Properties Listings",
        "Priority Search Ranking",
        "Direct Phone & WhatsApp Enquiry Leads",
        "Inventory Management Dashboard",
        "Dedicated Account Manager",
      ],
      isActive: true,
    },
  });

  // Featured listing plans (Configurable: ₹199 property, ₹99 room)
  await prisma.featuredPricingPlan.upsert({
    where: { code: "FEATURE_PROPERTY_WEEKLY" },
    update: { priceInr: 199, durationDays: 7 },
    create: {
      targetType: FeaturedTargetType.PROPERTY,
      name: "Featured Property Boost (7 Days)",
      code: "FEATURE_PROPERTY_WEEKLY",
      priceInr: 199,
      durationDays: 7,
      isActive: true,
    },
  });

  await prisma.featuredPricingPlan.upsert({
    where: { code: "FEATURE_ROOM_WEEKLY" },
    update: { priceInr: 99, durationDays: 7 },
    create: {
      targetType: FeaturedTargetType.ROOM_TYPE,
      name: "Featured Room Boost (7 Days)",
      code: "FEATURE_ROOM_WEEKLY",
      priceInr: 99,
      durationDays: 7,
      isActive: true,
    },
  });

  // 3. Seed Admin User
  console.log("3. Seeding Admin User...");
  await prisma.user.upsert({
    where: { supabaseAuthId: "admin-auth-id-001" },
    update: {},
    create: {
      supabaseAuthId: "admin-auth-id-001",
      email: "admin@staykro.in",
      phone: "+919999900000",
      role: Role.ADMIN,
      profile: {
        create: {
          fullName: "System Admin",
          city: "Bengaluru",
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
    },
  });

  // 4. Seed Owners & Properties (Hierarchy: Owner -> Property -> RoomType -> Room)
  console.log("4. Seeding Owners, Properties, Room Types, and Rooms...");

  // Owner 1: Suresh Reddy (Reddy Hospitality)
  const ownerUser1 = await prisma.user.upsert({
    where: { supabaseAuthId: "owner-auth-id-suresh" },
    update: {},
    create: {
      supabaseAuthId: "owner-auth-id-suresh",
      email: "suresh@reddycoliving.com",
      phone: "+919876543210",
      role: Role.OWNER,
      profile: {
        create: {
          fullName: "Suresh Reddy",
          city: "Bengaluru",
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
      ownerProfile: {
        create: {
          businessName: "Reddy Coliving & Stays",
          contactPhone: "+919876543210",
          whatsappNumber: "+919876543210",
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
    },
    include: { ownerProfile: true },
  });

  if (ownerUser1.ownerProfile) {
    // Property 1: Zolo Stays Prime (Koramangala, Bengaluru)
    const pg1 = await prisma.property.upsert({
      where: { slug: "zolo-stays-prime-koramangala" },
      update: {},
      create: {
        ownerId: ownerUser1.ownerProfile.id,
        name: "Zolo Stays Prime",
        slug: "zolo-stays-prime-koramangala",
        description: "Luxury coliving space near Sony World Signal with high-speed fiber WiFi, daily housekeeping, 3-course chef-prepared meals, and biometric entry.",
        propertyType: PropertyType.COLIVING,
        genderPolicy: GenderPolicy.UNISEX,
        status: PropertyStatus.PUBLISHED,
        isVerified: true,
        verifiedAt: new Date(),
        addressLine1: "Sony World Signal, 4th Block",
        locality: "Koramangala",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560034",
        latitude: 12.9352,
        longitude: 77.6245,
        contactPhone: "+919876543210",
        whatsappNumber: "+919876543210",
        gateClosingTime: "11:30 PM",
        noticePeriodDays: 30,
        houseRules: ["No smoking in rooms", "Quiet hours after 11 PM", "Visitors allowed in common areas till 8 PM"],
        foodIncluded: true,
        foodOffering: FoodOffering.VEG_NONVEG,
        startingPrice: 11500,
        images: {
          create: [
            {
              storageKey: "properties/zolo-prime-1.jpg",
              url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
              imageType: "FACADE",
              isCover: true,
              sortOrder: 0,
            },
            {
              storageKey: "properties/zolo-prime-2.jpg",
              url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
              imageType: "BEDROOM",
              sortOrder: 1,
            },
          ],
        },
      },
    });

    // Single Room (capacity is roomType.occupancy = 1)
    const existingRt1 = await prisma.roomType.findFirst({
      where: { propertyId: pg1.id, name: "Single Executive Room" },
    });
    if (!existingRt1) {
      await prisma.roomType.create({
        data: {
          propertyId: pg1.id,
          name: "Single Executive Room",
          occupancy: 1,
          monthlyRent: 18000,
          securityDeposit: 36000,
          hasAttachedBathroom: true,
          hasBalcony: true,
          hasAirConditioning: true,
          rooms: {
            create: [
              { roomNumber: "101", floor: 1, occupiedBeds: 1, status: RoomOperationalStatus.AVAILABLE }, // Full
              { roomNumber: "102", floor: 1, occupiedBeds: 0, status: RoomOperationalStatus.AVAILABLE }, // Vacant
            ],
          },
        },
      });
    }

    // 2-Seater Sharing (capacity is roomType.occupancy = 2)
    const existingRt2 = await prisma.roomType.findFirst({
      where: { propertyId: pg1.id, name: "2-Seater AC Sharing" },
    });
    if (!existingRt2) {
      await prisma.roomType.create({
        data: {
          propertyId: pg1.id,
          name: "2-Seater AC Sharing",
          occupancy: 2,
          monthlyRent: 11500,
          securityDeposit: 23000,
          hasAttachedBathroom: true,
          hasAirConditioning: true,
          rooms: {
            create: [
              { roomNumber: "201", floor: 2, occupiedBeds: 2, status: RoomOperationalStatus.AVAILABLE }, // Full
              { roomNumber: "202", floor: 2, occupiedBeds: 1, status: RoomOperationalStatus.AVAILABLE }, // 1 bed vacant!
              { roomNumber: "203", floor: 2, occupiedBeds: 0, status: RoomOperationalStatus.AVAILABLE }, // Both beds vacant
              { roomNumber: "204", floor: 2, occupiedBeds: 0, status: RoomOperationalStatus.UNDER_MAINTENANCE }, // Maintenance
            ],
          },
        },
      });
    }

    // Property 2: Sri Sai Grand Residency (HSR Layout, Bengaluru)
    const pg2 = await prisma.property.upsert({
      where: { slug: "sri-sai-grand-residency-hsr" },
      update: {},
      create: {
        ownerId: ownerUser1.ownerProfile.id,
        name: "Sri Sai Grand Residency",
        slug: "sri-sai-grand-residency-hsr",
        description: "Spacious tech-park proximity PG in HSR Layout Sector 2 with daily housekeeping, North & South Indian meals, and RO water.",
        propertyType: PropertyType.PG,
        genderPolicy: GenderPolicy.BOYS,
        status: PropertyStatus.PUBLISHED,
        isVerified: true,
        verifiedAt: new Date(),
        addressLine1: "27th Main, Sector 2",
        locality: "HSR Layout",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560102",
        latitude: 12.9121,
        longitude: 77.6446,
        contactPhone: "+919876543210",
        whatsappNumber: "+919876543210",
        gateClosingTime: "11:00 PM",
        noticePeriodDays: 30,
        houseRules: ["Boys only", "No alcohol in premises", "Gate closes 11 PM"],
        foodIncluded: true,
        foodOffering: FoodOffering.VEG_NONVEG,
        startingPrice: 8500,
        images: {
          create: [
            {
              storageKey: "properties/sai-grand-1.jpg",
              url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
              imageType: "FACADE",
              isCover: true,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    const existingRtPg2 = await prisma.roomType.findFirst({
      where: { propertyId: pg2.id, name: "2-Seater Standard" },
    });
    if (!existingRtPg2) {
      await prisma.roomType.create({
        data: {
          propertyId: pg2.id,
          name: "2-Seater Standard",
          occupancy: 2,
          monthlyRent: 8500,
          securityDeposit: 15000,
          hasAttachedBathroom: true,
          rooms: {
            create: [
              { roomNumber: "101", floor: 1, occupiedBeds: 2, status: RoomOperationalStatus.AVAILABLE },
              { roomNumber: "102", floor: 1, occupiedBeds: 1, status: RoomOperationalStatus.AVAILABLE },
              { roomNumber: "103", floor: 1, occupiedBeds: 0, status: RoomOperationalStatus.AVAILABLE },
            ],
          },
        },
      });
    }
  }

  // Owner 2: Meera Kulkarni (Aura Living)
  const ownerUser2 = await prisma.user.upsert({
    where: { supabaseAuthId: "owner-auth-id-meera" },
    update: {},
    create: {
      supabaseAuthId: "owner-auth-id-meera",
      email: "meera@auraliving.in",
      phone: "+919876543211",
      role: Role.OWNER,
      profile: {
        create: {
          fullName: "Meera Kulkarni",
          city: "Bengaluru",
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
      ownerProfile: {
        create: {
          businessName: "Aura Boutique Stays",
          contactPhone: "+919876543211",
          whatsappNumber: "+919876543211",
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
    },
    include: { ownerProfile: true },
  });

  if (ownerUser2.ownerProfile) {
    // Property 3: Aura Living for Women (Indiranagar, Bengaluru)
    const pg3 = await prisma.property.upsert({
      where: { slug: "aura-living-women-indiranagar" },
      update: {},
      create: {
        ownerId: ownerUser2.ownerProfile.id,
        name: "Aura Living for Women",
        slug: "aura-living-women-indiranagar",
        description: "Boutique, biometrically secured girls luxury stay in Indiranagar. Cook on-demand, terrace garden, and AC rooms.",
        propertyType: PropertyType.COLIVING,
        genderPolicy: GenderPolicy.GIRLS,
        status: PropertyStatus.PUBLISHED,
        isVerified: true,
        verifiedAt: new Date(),
        addressLine1: "100ft Road, Near Metro",
        locality: "Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
        latitude: 12.9784,
        longitude: 77.6408,
        contactPhone: "+919876543211",
        whatsappNumber: "+919876543211",
        gateClosingTime: "11:00 PM",
        noticePeriodDays: 30,
        houseRules: ["Girls only", "Biometric entry strictly monitored"],
        foodIncluded: true,
        foodOffering: FoodOffering.VEG_NONVEG,
        startingPrice: 14000,
        images: {
          create: [
            {
              storageKey: "properties/aura-1.jpg",
              url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
              imageType: "FACADE",
              isCover: true,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    const existingRtPg3 = await prisma.roomType.findFirst({
      where: { propertyId: pg3.id, name: "2-Seater Twin Bed AC" },
    });
    if (!existingRtPg3) {
      await prisma.roomType.create({
        data: {
          propertyId: pg3.id,
          name: "2-Seater Twin Bed AC",
          occupancy: 2,
          monthlyRent: 14000,
          securityDeposit: 28000,
          hasAttachedBathroom: true,
          hasAirConditioning: true,
          rooms: {
            create: [
              { roomNumber: "201", floor: 2, occupiedBeds: 1, status: RoomOperationalStatus.AVAILABLE },
              { roomNumber: "202", floor: 2, occupiedBeds: 0, status: RoomOperationalStatus.AVAILABLE },
            ],
          },
        },
      });
    }
  }

  // 5. Seed Roommate Seeker Users, Roommate Requests, and Roommate Interest
  console.log("5. Seeding Roommate Requests & Interactions...");

  // Roommate Seeker 1: Rohan Sharma (Amazon, Koramangala)
  const seeker1 = await prisma.user.upsert({
    where: { supabaseAuthId: "user-auth-rohan-sharma" },
    update: {},
    create: {
      supabaseAuthId: "user-auth-rohan-sharma",
      email: "rohan.sharma@example.com",
      phone: "+919811122233",
      role: Role.USER,
      profile: {
        create: {
          fullName: "Rohan Sharma",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          bio: "Software Engineer at Amazon. Chill, non-smoker, early riser, loves gym and weekend tech hackathons.",
          gender: GenderPolicy.BOYS,
          age: 24,
          profession: "Software Engineer",
          companyOrCollege: "Amazon",
          city: "Bengaluru",
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
    },
  });

  const req1 = await prisma.roommateRequest.create({
    data: {
      creatorId: seeker1.id,
      title: "Need 1 roommate for 2-Seater master bedroom",
      description: "Looking for an easy-going roommate to share a fully furnished 2-seater room in a gated 3BHK society with clubhouse, pool, high-speed WiFi, and daily maid service.",
      locality: "Koramangala 5th Block",
      city: "Bengaluru",
      state: "Karnataka",
      latitude: 12.9345,
      longitude: 77.6212,
      propertyName: "Prestige Acropolis 3BHK",
      roomTypeName: "2-Seater Master Bedroom",
      requiredRoommateCount: 1,
      currentOccupantsCount: 1,
      rentPerPerson: 9500,
      securityDeposit: 25000,
      preferredGender: GenderPolicy.BOYS,
      minAge: 21,
      maxAge: 30,
      moveInDate: new Date("2026-11-01"),
      availabilityDescription: "Available from November 1st",
      isFurnished: true,
      hasAttachedBathroom: true,
      status: RoommateRequestStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      preferences: {
        create: {
          dietary: DietaryPreference.NO_PREFERENCE,
          smoking: SmokingPreference.NON_SMOKER_ONLY,
          drinking: DrinkingPreference.OCCASIONAL_OK,
          occupation: OccupationPreference.WORKING_PROFESSIONAL,
          sleepSchedule: SleepSchedule.EARLY_BIRD,
          petsAllowed: false,
          customTags: ["Non-smoker", "Working Professional", "Vegetarian / Chill", "Early Riser"],
        },
      },
    },
  });

  // Prospective Roommate Applicant: Kunal Verma expresses interest in Rohan's request
  const seeker2 = await prisma.user.upsert({
    where: { supabaseAuthId: "user-auth-kunal-verma" },
    update: {},
    create: {
      supabaseAuthId: "user-auth-kunal-verma",
      email: "kunal.verma@example.com",
      phone: "+919844455566",
      role: Role.USER,
      profile: {
        create: {
          fullName: "Kunal Verma",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
          bio: "Financial Analyst at Deloitte. Clean, non-smoker, loves tennis.",
          gender: GenderPolicy.BOYS,
          age: 25,
          profession: "Financial Analyst",
          companyOrCollege: "Deloitte",
          city: "Bengaluru",
          verificationStatus: VerificationStatus.VERIFIED,
        },
      },
    },
  });

  // Create Conversation and RoommateInterest linking Rohan and Kunal
  const conv = await prisma.conversation.create({
    data: {
      roommateRequestId: req1.id,
      lastMessageText: "Hey Rohan, loved the room details! Would love to connect regarding move-in.",
      lastMessageAt: new Date(),
      participants: {
        create: [
          { userId: req1.creatorId },
          { userId: seeker2.id },
        ],
      },
      messages: {
        create: [
          {
            senderId: seeker2.id,
            content: "Hey Rohan, loved the room details! Would love to connect regarding move-in.",
          },
        ],
      },
    },
  });

  await prisma.roommateInterest.create({
    data: {
      requestId: req1.id,
      applicantId: seeker2.id,
      introMessage: "Hey Rohan, working professional at Deloitte nearby. Looking to move in around Nov 1.",
      conversationId: conv.id,
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
