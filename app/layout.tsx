import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/explain-my-bigo/header";
import { Footer } from "@/components/explain-my-bigo/footer";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExplainMyBigO",
  description:
    "ExplainMyBigO is a simple AI-powered tool that estimates the time and space complexity (Big-O) of your code, highlights key assumptions, and gives a short, clear explanation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(jetbrainsMono.variable, "dark")}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <div className="mx-auto flex h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6 md:py-8">
            <Header />
            {children}
            <Footer />
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
