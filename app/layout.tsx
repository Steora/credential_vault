import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Modern SaaS typography: Inter for all UI text
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Keep Geist Mono for code / technical details
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Credential Vault",
  description: "Secure credential and note management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthSessionProvider>
          <TooltipProvider delay={300}>
            {children}
          </TooltipProvider>
        </AuthSessionProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
