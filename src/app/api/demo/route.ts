import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { DEMO_MODE_COOKIE } from "@/lib/constants";
import { getDashboardSnapshot } from "@/lib/dashboard";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_MODE_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  const snapshot = await getDashboardSnapshot();
  return NextResponse.json(snapshot);
}
