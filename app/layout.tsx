import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BottomNav } from "@/components/layout/bottom-nav";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gwinya — eat, drink, with confidence",
    template: "%s · Gwinya",
  },
  description:
    "A gentle, gamified companion for people living with dysphagia. Practise safe routines, track symptoms, build confidence.",
  applicationName: "Gwinya",
  appleWebApp: { capable: true, title: "Gwinya", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f5ede0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col pb-[5.5rem]">
          {children}
        </div>
        <BottomNav />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
