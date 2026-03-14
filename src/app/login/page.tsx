import { LoginView } from "@/components/auth/login-view";
import { runtimeFlags } from "@/lib/env";

export default function LoginPage() {
  return <LoginView googleEnabled={runtimeFlags.hasGoogleAuth} />;
}
