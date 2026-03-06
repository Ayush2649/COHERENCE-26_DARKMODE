import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Outreach Automation Engine",
  description: "Mailchimp-style outreach automation with visual workflow builder and AI messaging",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
