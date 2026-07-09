import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Briefing — AI Research Agent",
  description:
    "AI-powered research briefing tool with real-time streaming. Powered by CrewAI, Gemini 2.5 Flash, and FastAPI.",
};

const themeInitScript = `
(function() {
  try {
    var stored = window.localStorage.getItem('smart-briefing-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${lora.variable} font-sans bg-paper text-ink antialiased min-h-screen transition-colors duration-200`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
