import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Briefing — AI Research Agent",
  description:
    "AI-powered research briefing tool with real-time streaming. Powered by CrewAI, Gemini 2.5 Flash, and FastAPI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans bg-gray-950 text-gray-100 antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
