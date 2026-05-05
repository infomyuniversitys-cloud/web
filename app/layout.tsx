import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import "./public.css";

export const metadata: Metadata = {
  title: "MyUniversitys — India's Smartest Education Referral Platform",
  description: "Refer students to top colleges, track your referrals, and earn rewards. Join India's fastest-growing education referral network.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  keywords: ["education", "referral", "colleges", "admissions", "rewards", "MyUniversitys"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
