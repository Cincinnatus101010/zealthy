import { mutate } from "swr";
import { SWR_KEYS } from "@/lib/swr/keys";

export async function revalidateWellness() {
  await Promise.all([mutate(SWR_KEYS.wellness), mutate(SWR_KEYS.dashboard)]);
}
