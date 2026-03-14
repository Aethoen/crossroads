"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { authClient } from "@/components/auth/auth-client";
import type { AppSession } from "@/components/auth/auth-types";
import { LocationPulseController } from "@/components/auth/location-pulse-controller";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type WorkspaceGateProps = {
  children: React.ReactNode;
};

export function WorkspaceGate({ children }: WorkspaceGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sessionState = authClient.useSession();
  const session = sessionState.data as AppSession;

  useEffect(() => {
    if (sessionState.isPending) {
      return;
    }

    if (!session?.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!session.user.onboardingCompletedAt) {
      router.replace("/onboarding");
    }
  }, [pathname, router, session, sessionState.isPending]);

  if (sessionState.isPending) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Card className="surface-glow w-full max-w-xl text-center">
          <Badge variant="gold" className="mx-auto w-fit">
            Authenticating workspace
          </Badge>
          <LoaderCircle className="mx-auto mt-6 h-8 w-8 animate-spin text-secondary" />
          <CardTitle className="mt-6 text-3xl">Checking your Crossroads session.</CardTitle>
          <CardDescription className="mt-3">
            Loading account state, onboarding progress, and live location controls.
          </CardDescription>
        </Card>
      </div>
    );
  }

  if (!session?.user || !session.user.onboardingCompletedAt) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Card className="surface-glow w-full max-w-xl text-center">
          <Badge variant="cool" className="mx-auto w-fit">
            Routing to the right place
          </Badge>
          <ShieldCheck className="mx-auto mt-6 h-8 w-8 text-secondary" />
          <CardTitle className="mt-6 text-3xl">Preparing your protected workspace.</CardTitle>
          <CardDescription className="mt-3">
            Crossroads is redirecting you to login or onboarding based on your current session.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <>
      {children}
      <LocationPulseController
        enabled={session.user.locationMode === "live"}
        mode={session.user.locationMode ?? "disabled"}
      />
    </>
  );
}
