import { WellnessType, type WellnessEntry } from "@prisma/client";
import { prisma } from "@/lib/db";

export type WellnessEntryInput = {
  type: WellnessType;
  label: string;
  value: number;
  unit?: string | null;
  date: string;
  notes?: string | null;
};

export type WellnessEntryRecord = Pick<
  WellnessEntry,
  "id" | "type" | "label" | "value" | "unit" | "date" | "notes" | "createdAt"
>;

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }
  return date;
}

export function validateWellnessEntryInput(input: WellnessEntryInput) {
  if (!input.label.trim()) {
    throw new Error("Activity label is required.");
  }

  if (!Number.isFinite(input.value)) {
    throw new Error("Value must be a number.");
  }

  parseDate(input.date);
}

export async function listWellnessEntries(userId: string) {
  return prisma.wellnessEntry.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      label: true,
      value: true,
      unit: true,
      date: true,
      notes: true,
      createdAt: true,
    },
  });
}

export async function createWellnessEntry(userId: string, input: WellnessEntryInput) {
  validateWellnessEntryInput(input);

  const entry = await prisma.wellnessEntry.create({
    data: {
      userId,
      type: input.type,
      label: input.label.trim(),
      value: input.value,
      unit: input.unit?.trim() || null,
      date: parseDate(input.date),
      notes: input.notes?.trim() || null,
    },
    select: {
      id: true,
      type: true,
      label: true,
      value: true,
      unit: true,
      date: true,
      notes: true,
      createdAt: true,
    },
  });

  if (input.type === WellnessType.custom) {
    await prisma.customActivityType.upsert({
      where: {
        userId_name: {
          userId,
          name: input.label.trim(),
        },
      },
      update: { unit: input.unit?.trim() || null },
      create: {
        userId,
        name: input.label.trim(),
        unit: input.unit?.trim() || null,
      },
    });
  }

  return entry;
}

export async function updateWellnessEntry(
  userId: string,
  entryId: string,
  input: Partial<WellnessEntryInput>,
) {
  const existing = await prisma.wellnessEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!existing) {
    throw new Error("Entry not found.");
  }

  const next: WellnessEntryInput = {
    type: input.type ?? existing.type,
    label: input.label ?? existing.label,
    value: input.value ?? existing.value,
    unit: input.unit === undefined ? existing.unit : input.unit,
    date: input.date ?? existing.date.toISOString().slice(0, 10),
    notes: input.notes === undefined ? existing.notes : input.notes,
  };

  validateWellnessEntryInput(next);

  return prisma.wellnessEntry.update({
    where: { id: entryId },
    data: {
      type: next.type,
      label: next.label.trim(),
      value: next.value,
      unit: next.unit?.trim() || null,
      date: parseDate(next.date),
      notes: next.notes?.trim() || null,
    },
    select: {
      id: true,
      type: true,
      label: true,
      value: true,
      unit: true,
      date: true,
      notes: true,
      createdAt: true,
    },
  });
}

export async function deleteWellnessEntry(userId: string, entryId: string) {
  const existing = await prisma.wellnessEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Entry not found.");
  }

  await prisma.wellnessEntry.delete({ where: { id: entryId } });
}

export async function listCustomActivityTypes(userId: string) {
  return prisma.customActivityType.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true },
  });
}
