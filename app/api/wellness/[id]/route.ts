import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { deleteWellnessEntry, updateWellnessEntry } from "@/lib/wellness/entries";
import { WellnessType } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseWellnessType(value: unknown): WellnessType | undefined {
  if (value === undefined) return undefined;
  if (value === WellnessType.water || value === WellnessType.calories || value === WellnessType.custom) {
    return value;
  }
  throw new Error("Invalid activity type.");
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      type?: WellnessType;
      label?: string;
      value?: number;
      unit?: string | null;
      date?: string;
      notes?: string | null;
    };

    const entry = await updateWellnessEntry(user.id, id, {
      type: parseWellnessType(body.type),
      label: body.label,
      value: body.value === undefined ? undefined : Number(body.value),
      unit: body.unit,
      date: body.date,
      notes: body.notes,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update entry.";
    const status = message === "Entry not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await deleteWellnessEntry(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete entry.";
    const status = message === "Entry not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
