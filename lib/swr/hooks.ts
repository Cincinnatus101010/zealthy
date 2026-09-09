"use client";

import useSWR from "swr";
import type { WellnessApiResponse } from "@/lib/swr/types";
import { SWR_KEYS } from "@/lib/swr/keys";
import type { DashboardData } from "@/types/wellness";

const sharedOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  keepPreviousData: true,
} as const;

export function useDashboardData(fallbackData?: DashboardData) {
  return useSWR<DashboardData>(SWR_KEYS.dashboard, {
    ...sharedOptions,
    fallbackData,
  });
}

export function useWellnessData(fallbackData?: WellnessApiResponse) {
  return useSWR<WellnessApiResponse>(SWR_KEYS.wellness, {
    ...sharedOptions,
    fallbackData,
  });
}
