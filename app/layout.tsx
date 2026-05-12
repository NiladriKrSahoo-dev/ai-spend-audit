import type { Metadata, Viewport } from "next";
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

// Setting the viewport explicitly ensures mobile-friendliness scores stay at 100
export const viewport: Viewport = {
  themeColor: "#F7F7F5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Vantage | AI Subscription Audit & Savings Engine",
  description:
    "Instantly audit your AI tool subscriptions. Identify ghost seats, unlock annual billing savings, and eliminate waste across Cursor, Claude, ChatGPT, and more.",
  keywords: ["AI Spend", "SaaS Audit", "Cost Optimization", "AI Subscriptions", "Cloud Waste"],
  authors: [{ name: "Vantage Engineering" }],
  metadataBase: new URL("https://ai-spend-audit-34bqydphh-niladri-kumar-sahoo-s-projects.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vantage | AI Subscription Audit",
    description: "Identify hidden waste in your AI SaaS spend instantly.",
    url: "https://ai-spend-audit-34bqydphh-niladri-kumar-sahoo-s-projects.vercel.app",
    siteName: "Vantage",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vantage | AI Subscription Audit",
    description: "Stop capital leakage in your AI stack.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
