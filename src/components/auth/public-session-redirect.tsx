"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/components/auth/auth-client";
import type { AppSession } from "@/components/auth/auth-types";

function resolveDestination(session: AppSession) {
  if (!session?.user) {
    return null;
  }

  return session.user.onboardingCompletedAt ? "/dashboard" : "/onboarding";
}

export function PublicSessionRedirect() {
  const router = useRouter();
  const sessionState = authClient.useSession();
  const session = sessionState.data as AppSession;

  useEffect(() => {
    const destination = resolveDestination(session);
    if (destination) {
      router.replace(destination);
    }
  }, [router, session]);

  return null;
}
