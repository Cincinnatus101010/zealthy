export type WellnessActivityType = {
  id: string;
  name: string;
  unit: string | null;
};

export type WellnessEntryRecord = {
  id: string;
  type: string;
  label: string;
  value: number;
  unit: string | null;
  date: string;
  notes: string | null;
  createdAt?: string;
};

export type WellnessApiResponse = {
  entries: WellnessEntryRecord[];
  activityTypes: WellnessActivityType[];
};
