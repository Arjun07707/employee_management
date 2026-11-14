import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/providers";

import "./globals.css";

const display = Instrument_Serif({
  variable: "--f-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const ui = Geist({
  variable: "--f-ui",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--f-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Employee Management",
    template: "%s · Employee Management",
  },
  description:
    "Manage employees, departments and salaries in one modern dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${ui.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
