// Client-safe enum definitions and types for Roommate features
// Avoids bundling Prisma runtime / node:module into client chunks

export const GenderPolicy = {
  BOYS: "BOYS",
  GIRLS: "GIRLS",
  UNISEX: "UNISEX",
} as const;
export type GenderPolicy = (typeof GenderPolicy)[keyof typeof GenderPolicy];

export const RoommateRequestStatus = {
  ACTIVE: "ACTIVE",
  FILLED: "FILLED",
  EXPIRED: "EXPIRED",
  CLOSED: "CLOSED",
  UNDER_REVIEW: "UNDER_REVIEW",
} as const;
export type RoommateRequestStatus =
  (typeof RoommateRequestStatus)[keyof typeof RoommateRequestStatus];

export const RoommateInterestStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  WITHDRAWN: "WITHDRAWN",
} as const;
export type RoommateInterestStatus =
  (typeof RoommateInterestStatus)[keyof typeof RoommateInterestStatus];

export const DietaryPreference = {
  VEGETARIAN_ONLY: "VEGETARIAN_ONLY",
  NON_VEG_OK: "NON_VEG_OK",
  VEGAN: "VEGAN",
  NO_PREFERENCE: "NO_PREFERENCE",
} as const;
export type DietaryPreference =
  (typeof DietaryPreference)[keyof typeof DietaryPreference];

export const SmokingPreference = {
  NON_SMOKER_ONLY: "NON_SMOKER_ONLY",
  OUTSIDE_ONLY: "OUTSIDE_ONLY",
  SMOKING_OK: "SMOKING_OK",
} as const;
export type SmokingPreference =
  (typeof SmokingPreference)[keyof typeof SmokingPreference];

export const DrinkingPreference = {
  NON_DRINKER_ONLY: "NON_DRINKER_ONLY",
  OCCASIONAL_OK: "OCCASIONAL_OK",
  NO_PREFERENCE: "NO_PREFERENCE",
} as const;
export type DrinkingPreference =
  (typeof DrinkingPreference)[keyof typeof DrinkingPreference];

export const OccupationPreference = {
  ANY: "ANY",
  WORKING_PROFESSIONAL: "WORKING_PROFESSIONAL",
  STUDENT: "STUDENT",
} as const;
export type OccupationPreference =
  (typeof OccupationPreference)[keyof typeof OccupationPreference];

export const SleepSchedule = {
  EARLY_BIRD: "EARLY_BIRD",
  NIGHT_OWL: "NIGHT_OWL",
  FLEXIBLE: "FLEXIBLE",
} as const;
export type SleepSchedule =
  (typeof SleepSchedule)[keyof typeof SleepSchedule];
