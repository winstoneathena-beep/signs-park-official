import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteFrame } from "@/components/site/SiteFrame";
import { OnboardingGate } from "@/components/site/OnboardingGate";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Parkwell Signs — On-brand parking signage, ordered in minutes",
    template: "%s · Parkwell Signs",
  },
  description:
    "The Parkwell internal signage platform. Pick a template, customize within brand standards, get vendor-ready files. Built for managers, approved by leadership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <OnboardingGate>
              <SiteFrame>{children}</SiteFrame>
            </OnboardingGate>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
