/**
 * Root Layout (MVC: View Layer)
 * 
 * Sets up:
 * - Google Fonts (Geist Sans + Geist Mono)
 * - ThemeProvider for light/dark mode toggle
 * - Global CSS variables and ShadCN theming
 * - SEO metadata
 */
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Outreach Engine — Intelligent Email Automation",
  description:
    "A Mailchimp-style outreach automation platform with visual workflow builder and AI-generated messaging.",
  keywords: ["outreach", "automation", "AI", "email", "campaign", "workflow"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
