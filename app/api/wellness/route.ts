import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  createWellnessEntry,
  listCustomActivityTypes,
  listWellnessEntries,
} from "@/lib/wellness/entries";
import { WellnessType } from "@prisma/client";

function parseWellnessType(value: unknown): WellnessType {
  if (value === WellnessType.water || value === WellnessType.calories || value === WellnessType.custom) {
    return value;
  }
  throw new Error("Invalid activity type.");
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [entries, activityTypes] = await Promise.all([
    listWellnessEntries(user.id),
    listCustomActivityTypes(user.id),
  ]);

  return NextResponse.json({ entries, activityTypes });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      type?: WellnessType;
      label?: string;
      value?: number;
      unit?: string;
      date?: string;
      notes?: string;
    };

    const entry = await createWellnessEntry(user.id, {
      type: parseWellnessType(body.type),
      label: body.label ?? "",
      value: Number(body.value),
      unit: body.unit,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      notes: body.notes,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save entry.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
