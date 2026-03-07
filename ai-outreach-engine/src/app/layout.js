/**
 * Root Layout (MVC: View Layer)
 * Light-first, minimal design with dynamic background.
 */
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import ParticleBackground from "@/components/ParticleBackground";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-foreground`}
      >
        <ThemeProvider>
          <ParticleBackground />
          <div className="relative min-h-screen">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
