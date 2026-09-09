import type { Metadata } from "next";
import "@troisi/ui/styles.css";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zealthy Wellness Tracker",
  description: "Track sleep, steps, and personal wellness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="troisi-root">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
