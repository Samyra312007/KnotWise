import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnotWise — The Matchmaker's Bureau",
  description:
    "An operating console for a private matchmaking bureau. Editorial, calm, decisive.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="bg-paper text-ink antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            unstyled: false,
            classNames: {
              toast:
                "!bg-ink !text-paper !border-0 !rounded-none !font-sans !text-[14px] !shadow-none !pl-4 [&>div]:!gap-3 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-vermilion",
            },
          }}
        />
      </body>
    </html>
  );
}
