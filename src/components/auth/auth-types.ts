import type { LocationMode } from "@/lib/types";

export type AppSessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  onboardingCompletedAt?: string | null;
  calendarConnected?: boolean;
  locationMode?: LocationMode;
  locationSharingEnabled?: boolean;
};

export type AppSession = {
  user?: AppSessionUser;
  session?: {
    id?: string;
    expiresAt?: string;
  };
} | null;
