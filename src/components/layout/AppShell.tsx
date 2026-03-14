"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NavBar } from "./NavBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center px-6">
        <div className="paper-note flex items-center gap-3 px-6 py-5">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-border border-t-transparent" />
          <p className="text-lg">Gathering your plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen bg-background">
      <NavBar />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
