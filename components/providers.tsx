"use client";

import { SWRConfig } from "swr";
import { ThemeProvider } from "@troisi/ui";
import { swrFetcher } from "@/lib/swr/fetcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="zeathy-theme">
      <SWRConfig
        value={{
          fetcher: swrFetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          shouldRetryOnError: false,
          keepPreviousData: true,
        }}
      >
        {children}
      </SWRConfig>
    </ThemeProvider>
  );
}
