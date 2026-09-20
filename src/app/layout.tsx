import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { demoStore } from "@/lib/memory/demo-store";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LUMI — Your AI tutor that sees, hears, teaches and learns with you",
  description:
    "Lumi is a multimodal AI tutor. Talk, scan, practice and progress — it builds an evolving model of how you learn.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { streak } = await demoStore.getProfile();
  return (
    <html lang="en">
      <body className={`${nunito.variable} min-h-screen`}>
        <NavBar streak={streak} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
