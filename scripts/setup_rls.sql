-- ==============================================================================
-- StayKro Platform: Production Supabase PostgreSQL Row Level Security (RLS)
-- Enables strict multi-tenant isolation, public discovery guards, and admin rules.
-- ==============================================================================

-- 1. Helper function: Get the application user ID from Supabase Auth UID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
  SELECT "id" FROM "User" WHERE "supabaseAuthId" = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Helper function: Check if current authenticated user has ADMIN role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User"
    WHERE "supabaseAuthId" = auth.uid()::text AND "role" = 'ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Helper function: Check if current user is the owner of a property
CREATE OR REPLACE FUNCTION is_property_owner(prop_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Property" p
    JOIN "OwnerProfile" op ON p."ownerId" = op."id"
    WHERE p."id" = prop_id AND op."userId" = get_current_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- ==============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OwnerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OwnerInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoomType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Amenity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyAmenity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoommateRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoommateInterest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedProperty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedRoommateRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PGEnquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "City" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Locality" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLICIES: PUBLIC MASTER DATA (City, Locality, Amenity)
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view active cities" ON "City";
CREATE POLICY "Public can view active cities" ON "City"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active localities" ON "Locality";
CREATE POLICY "Public can view active localities" ON "Locality"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view amenities" ON "Amenity";
CREATE POLICY "Public can view amenities" ON "Amenity"
  FOR SELECT USING (true);

-- ==============================================================================
-- POLICIES: USER & PROFILE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view public profiles" ON "Profile";
CREATE POLICY "Users can view public profiles" ON "Profile"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON "Profile";
CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING ("userId" = get_current_user_id() OR is_admin());

DROP POLICY IF EXISTS "Users can view own User record" ON "User";
CREATE POLICY "Users can view own User record" ON "User"
  FOR SELECT USING ("supabaseAuthId" = auth.uid()::text OR is_admin());

-- ==============================================================================
-- POLICIES: PROPERTIES & ROOM INVENTORY
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view published properties" ON "Property";
CREATE POLICY "Public can view published properties" ON "Property"
  FOR SELECT USING (
    ("status" = 'PUBLISHED' AND "deletedAt" IS NULL)
    OR "ownerId" IN (SELECT "id" FROM "OwnerProfile" WHERE "userId" = get_current_user_id())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Owners can modify own properties" ON "Property";
CREATE POLICY "Owners can modify own properties" ON "Property"
  FOR ALL USING (
    "ownerId" IN (SELECT "id" FROM "OwnerProfile" WHERE "userId" = get_current_user_id())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Public can view images of accessible properties" ON "PropertyImage";
CREATE POLICY "Public can view images of accessible properties" ON "PropertyImage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Property" p
      WHERE p."id" = "PropertyImage"."propertyId"
      AND (p."status" = 'PUBLISHED' OR is_property_owner(p."id") OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Public can view room types of accessible properties" ON "RoomType";
CREATE POLICY "Public can view room types of accessible properties" ON "RoomType"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Property" p
      WHERE p."id" = "RoomType"."propertyId"
      AND (p."status" = 'PUBLISHED' OR is_property_owner(p."id") OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Public can view rooms of accessible properties" ON "Room";
CREATE POLICY "Public can view rooms of accessible properties" ON "Room"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "RoomType" rt
      JOIN "Property" p ON rt."propertyId" = p."id"
      WHERE rt."id" = "Room"."roomTypeId"
      AND (p."status" = 'PUBLISHED' OR is_property_owner(p."id") OR is_admin())
    )
  );

-- ==============================================================================
-- POLICIES: ROOMMATE SHARE & INTERESTS
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view active roommate requests" ON "RoommateRequest";
CREATE POLICY "Public can view active roommate requests" ON "RoommateRequest"
  FOR SELECT USING (
    ("status" = 'ACTIVE' AND "deletedAt" IS NULL)
    OR "creatorId" = get_current_user_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Creators can modify own roommate requests" ON "RoommateRequest";
CREATE POLICY "Creators can modify own roommate requests" ON "RoommateRequest"
  FOR ALL USING (
    "creatorId" = get_current_user_id() OR is_admin()
  );

DROP POLICY IF EXISTS "Applicants and creators can view roommate interests" ON "RoommateInterest";
CREATE POLICY "Applicants and creators can view roommate interests" ON "RoommateInterest"
  FOR SELECT USING (
    "applicantId" = get_current_user_id()
    OR EXISTS (
      SELECT 1 FROM "RoommateRequest" r
      WHERE r."id" = "RoommateInterest"."requestId"
      AND r."creatorId" = get_current_user_id()
    )
    OR is_admin()
  );

-- ==============================================================================
-- POLICIES: IN-PLATFORM CHAT & REALTIME
-- ==============================================================================
DROP POLICY IF EXISTS "Participants can view conversations" ON "Conversation";
CREATE POLICY "Participants can view conversations" ON "Conversation"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp."conversationId" = "Conversation"."id"
      AND cp."userId" = get_current_user_id()
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "Participants can view messages" ON "Message";
CREATE POLICY "Participants can view messages" ON "Message"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp."conversationId" = "Message"."conversationId"
      AND cp."userId" = get_current_user_id()
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "Participants can insert messages" ON "Message";
CREATE POLICY "Participants can insert messages" ON "Message"
  FOR INSERT WITH CHECK (
    "senderId" = get_current_user_id()
    AND EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp."conversationId" = "Message"."conversationId"
      AND cp."userId" = get_current_user_id()
    )
  );

-- ==============================================================================
-- POLICIES: SAVED LISTINGS (BOOKMARKS)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can manage own saved properties" ON "SavedProperty";
CREATE POLICY "Users can manage own saved properties" ON "SavedProperty"
  FOR ALL USING (
    "userId" = get_current_user_id() OR is_admin()
  );

DROP POLICY IF EXISTS "Users can manage own saved roommate requests" ON "SavedRoommateRequest";
CREATE POLICY "Users can manage own saved roommate requests" ON "SavedRoommateRequest"
  FOR ALL USING (
    "userId" = get_current_user_id() OR is_admin()
  );

-- ==============================================================================
-- POLICIES: REVIEWS & RATINGS
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view approved reviews" ON "Review";
CREATE POLICY "Public can view approved reviews" ON "Review"
  FOR SELECT USING (
    "status" = 'APPROVED'
    OR "userId" = get_current_user_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own reviews" ON "Review";
CREATE POLICY "Users can insert own reviews" ON "Review"
  FOR INSERT WITH CHECK (
    "userId" = get_current_user_id()
  );

DROP POLICY IF EXISTS "Users can update own reviews" ON "Review";
CREATE POLICY "Users can update own reviews" ON "Review"
  FOR UPDATE USING (
    "userId" = get_current_user_id() OR is_admin()
  );

-- ==============================================================================
-- POLICIES: REPORTS & AUDIT LOGS
-- ==============================================================================
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON "Report";
CREATE POLICY "Authenticated users can submit reports" ON "Report"
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can view and manage reports" ON "Report";
CREATE POLICY "Admins can view and manage reports" ON "Report"
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Only admins can view audit logs" ON "AuditLog";
CREATE POLICY "Only admins can view audit logs" ON "AuditLog"
  FOR SELECT USING (is_admin());
