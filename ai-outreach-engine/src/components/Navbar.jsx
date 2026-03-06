/**
 * Navbar Component (MVC: View Layer)
 * 
 * Shared navigation bar with theme toggle.
 * Provides links to all five main views of the application.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

/* Navigation items — one for each of the 5 main views */
const navItems = [
  { href: "/leads", label: "Upload Leads", icon: "📤" },
  { href: "/workflows", label: "Workflow Builder", icon: "🔀" },
  { href: "/ai-generator", label: "AI Generator", icon: "🤖" },
  { href: "/campaigns", label: "Campaigns", icon: "🚀" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <span className="text-lg">⚡</span>
          </div>
          <span className="text-lg font-bold gradient-text">AI Outreach</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 text-sm"
              >
                <span>{item.icon}</span>
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Right side: Theme toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
