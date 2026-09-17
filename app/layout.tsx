import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klein Sterre Akademie | Krieket Besprekings",
  description: "Bespreek krieketsessies by Klein Sterre Akademie.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="af"><body>{children}</body></html>;
}
