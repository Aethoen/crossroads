import { NextResponse } from "next/server";

import { refreshDashboardSuggestions } from "@/lib/dashboard";

export async function POST() {
  const suggestions = await refreshDashboardSuggestions();
  return NextResponse.json({ suggestions });
}
