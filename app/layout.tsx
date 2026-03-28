import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FirebaseAnalytics from "@/app/components/FirebaseAnalytics";
import SkipNav from "@/app/components/SkipNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Riskly — Gemini-Powered Threat Intelligence Bridge",
  description:
    "Riskly converts any unstructured, real-world message — suspicious SMS, phishing email, scam call transcript — into structured, verified, life-saving action plans using Google Gemini AI, Safe Browsing, and Firebase. A universal bridge between human intent and complex fraud-detection systems.",
  keywords: [
    "scam detector",
    "phishing detector",
    "AI fraud analysis",
    "message risk analyzer",
    "Google Gemini",
    "Firebase",
    "Safe Browsing",
    "societal benefit AI",
    "threat intelligence",
    "unstructured input AI",
  ],
  openGraph: {
    title: "Riskly — Gemini-Powered Threat Intelligence Bridge",
    description:
      "Converts any suspicious message into structured, verified, life-saving action plans using Google Gemini AI.",
    type: "website",
  },
  metadataBase: new URL("https://riskly.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SkipNav />
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
