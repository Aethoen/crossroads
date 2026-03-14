import { OnboardingView } from "@/components/onboarding/onboarding-view";
import { runtimeFlags } from "@/lib/env";

export default function OnboardingPage() {
  return (
    <OnboardingView
      googleEnabled={runtimeFlags.hasGoogleAuth}
      calendarEnabled={runtimeFlags.hasGoogleAuth}
    />
  );
}
