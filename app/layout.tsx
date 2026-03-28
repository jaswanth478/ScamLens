import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedBridge — AI Emergency Triage & Scam Detector",
  description:
    "MedBridge is an AI-powered emergency bridge that converts messy, unstructured real-world inputs — panicked medical descriptions, injury photos, suspicious messages — into structured, verified, life-saving actions using Google Gemini.",
  keywords: [
    "medical triage",
    "AI emergency",
    "scam detector",
    "Gemini AI",
    "first aid",
    "emergency response",
    "hospital finder",
  ],
  openGraph: {
    title: "MedBridge — AI Emergency Triage & Scam Detector",
    description:
      "From panic to action in seconds. Powered by Google Gemini.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
