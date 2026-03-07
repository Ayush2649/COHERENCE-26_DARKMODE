/**
 * Navbar — Expanded title and menu. Framer Motion hover/tap. Lucide icons.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  GitBranch,
  Sparkles,
  Rocket,
  BarChart3,
  Bot,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/leads", label: "Leads", Icon: Upload },
  { href: "/workflows", label: "Workflows", Icon: GitBranch },
  { href: "/ai-messages", label: "AI Messages", Icon: Sparkles },
  { href: "/campaigns", label: "Campaigns", Icon: Rocket },
  { href: "/dashboard", label: "Dashboard", Icon: BarChart3 },
  { href: "/agent", label: "AI Agent", Icon: Bot, premium: true },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
            whileHover={{ scale: 1.08, rotate: 6 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Zap className="h-5 w-5" />
          </motion.div>
          <span className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            AI Outreach Engine
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navItems.map((item, i) => {
            const Icon = item.Icon;
            const active = pathname === item.href;
            return (
              <motion.div key={item.href} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.25 }}>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      size="default"
                      className={`gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground ${
                        active ? "text-foreground bg-muted" : ""
                      } ${item.premium ? "border border-primary/20 text-primary hover:bg-primary/5 hover:text-primary" : ""}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div className="flex shrink-0 items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <ThemeToggle />
        </motion.div>
      </div>
    </motion.nav>
  );
}
