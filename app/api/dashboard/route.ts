import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  getDashboardData,
  getDefaultDashboardData,
} from "@/lib/wellness/dashboard-data";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const data = await getDashboardData(user.email).catch(() => getDefaultDashboardData());
  return NextResponse.json(data);
}
