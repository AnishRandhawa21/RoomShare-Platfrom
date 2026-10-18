export type GenderPreference = "Male" | "Female" | "Unisex";

export type RoomType = "Single Room" | "2-Sharing" | "3-Sharing" | "4-Sharing" | "Private Studio";

export interface PGProperty {
  id: string;
  name: string;
  tagline: string;
  locality: string;
  city: string;
  distance: string; // e.g. "0.8 km from Metro"
  startingPrice: number;
  gender: GenderPreference;
  verified: boolean;
  rating: number;
  reviewCount: number;
  availableRoomTypes: RoomType[];
  amenities: string[];
  foodIncluded: boolean;
  imageUrl: string;
  featured?: boolean;
}

export interface RoommateRequest {
  id: string;
  title: string;
  seekerName: string;
  seekerAge: number;
  seekerGender: "Male" | "Female";
  seekerProfession: string;
  seekerCompanyOrCollege?: string;
  locality: string;
  city: string;
  rentPerPerson: number;
  roomType: string; // e.g., "2-Seater", "Private Room in 3BHK"
  moveInDate: string; // e.g. "Available from November"
  deposit: string;
  preferences: string[];
  avatarUrl: string;
  verified: boolean;
  urgencyTag?: string; // e.g., "Urgent Requirement"
  description: string;
}

export interface PopularLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  pgsCount: number;
  roommatesCount: number;
  averageRent: string;
  imageUrl: string;
}
