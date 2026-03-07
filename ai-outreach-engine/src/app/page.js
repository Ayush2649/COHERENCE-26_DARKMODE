/**
 * Landing — Framer Motion hover/tap. Particle background from layout.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Upload, GitBranch, Sparkles, Rocket, BarChart3, Bot, LayoutGrid, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";

const features = [
  {
    href: "/leads",
    Icon: Upload,
    title: "Upload Leads",
    description: "Import contacts via CSV. Parse, preview, and save to your database.",
  },
  {
    href: "/workflows",
    Icon: GitBranch,
    title: "Workflow Builder",
    description: "Drag-and-drop automation flows with conditions and delays.",
  },
  {
    href: "/ai-generator",
    Icon: Sparkles,
    title: "AI Message Generator",
    description: "Generate personalized cold emails with OpenAI and lead data.",
  },
  {
    href: "/campaigns",
    Icon: Rocket,
    title: "Campaigns",
    description: "Run campaigns and watch leads move through workflows in real time.",
  },
  {
    href: "/dashboard",
    Icon: BarChart3,
    title: "Dashboard",
    description: "Charts, funnel, and activity feed for outreach metrics.",
  },
  {
    href: "/agent",
    Icon: Bot,
    title: "AI Agent",
    description: "Autonomous agent to create and run campaigns from natural language.",
  },
];

const techStack = ["Next.js", "Tailwind", "ShadCN", "React Flow", "OpenAI", "SQLite"];

export default function HomePage() {
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <motion.section
        className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div variants={item}>
            <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
              Sales outreach automation
            </Badge>
          </motion.div>
          <motion.h1 variants={item} className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            AI Outreach
          </motion.h1>
          <motion.p variants={item} className="mt-4 max-w-xl text-lg text-muted-foreground">
            Visual workflows, AI-generated messages, and campaigns that run themselves.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex gap-3">
            <Link href="/leads">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Button size="lg" className="gap-2 px-6">
                  <Upload className="h-4 w-4" />
                  Upload Leads
                </Button>
              </motion.div>
            </Link>
            <Link href="/dashboard">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Button size="lg" variant="outline" className="gap-2 px-6">
                  <BarChart3 className="h-4 w-4" />
                  View Dashboard
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          <motion.div variants={item} className="mt-8 flex flex-wrap justify-center gap-2">
            {techStack.map((tech) => (
              <motion.span key={tech} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                  {tech}
                </Badge>
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <Separator className="mx-auto max-w-5xl opacity-40" />

      {/* How it works */}
      <motion.section
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-center text-2xl font-semibold text-foreground">How it works</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground max-w-xl mx-auto">
          Three steps from lead list to automated outreach
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            { step: "1", title: "Upload & segment", desc: "Import leads via CSV. Use name, email, company, and role to personalize later.", href: "/leads" },
            { step: "2", title: "Build your flow", desc: "Design workflows with send email, wait, conditions, follow-ups, and thank-you paths.", href: "/workflows" },
            { step: "3", title: "Run & track", desc: "Start campaigns, let the AI send emails, and monitor funnel and activity in the dashboard.", href: "/dashboard" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className="relative rounded-xl border border-border bg-card p-6 text-center dark:border-white/10 dark:bg-[oklch(0.16_0.008_285)]"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{item.step}</span>
              <h3 className="text-base font-semibold text-foreground mt-2">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              <Link href={item.href} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Go →</Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <Separator className="mx-auto max-w-5xl opacity-40" />

      {/* Stats / benefits strip */}
      <motion.section
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
          {[
            { label: "CSV import", value: "Seconds" },
            { label: "Visual builder", value: "No code" },
            { label: "AI copy", value: "Personalized" },
            { label: "Dashboard", value: "Real-time" },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 px-4 py-5 dark:border-white/10 dark:bg-white/5">
              <div className="text-lg font-semibold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      <Separator className="mx-auto max-w-5xl opacity-40" />

      <motion.section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-center text-2xl font-semibold text-foreground">Modules</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Everything you need for smart outreach
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1 dark:bg-white/10">Personalized at scale</span>
          <span className="rounded-full bg-muted px-3 py-1 dark:bg-white/10">Conditional flows</span>
          <span className="rounded-full bg-muted px-3 py-1 dark:bg-white/10">One dashboard</span>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.Icon;
            return (
              <motion.div
                key={feature.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                <Link href={feature.href} className="group block">
                  <motion.div
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card className="h-full border-border/60 bg-card/80 transition-shadow duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                      <CardHeader className="flex flex-row items-start gap-4">
                        <motion.div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                        <div>
                          <CardTitle className="text-base font-medium">{feature.title}</CardTitle>
                          <CardDescription className="mt-1 text-sm">{feature.description}</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Card className="border-dashed border-border/60 bg-muted/30">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium">MVC Architecture</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    Models: Lead, Workflow, Campaign, EmailLog. Views: ShadCN + React Flow.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-foreground">Ready to automate outreach?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Upload leads, build a workflow, and run your first campaign in minutes.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/leads">
            <Button size="lg" className="gap-2">Upload Leads</Button>
          </Link>
          <Link href="/agent">
            <Button size="lg" variant="outline" className="gap-2">Try AI Agent</Button>
          </Link>
        </div>
      </motion.section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
          AI Outreach Engine
        </div>
      </footer>

      {/* Sticky chatbot FAB — redirects to /ai-messages */}
      <motion.div
        className="group fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
          AI Messages
        </span>
        <Link href="/ai-messages">
          <motion.span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            role="button"
            aria-label="Open AI Messages"
          >
            <MessageCircle className="h-7 w-7" />
          </motion.span>
        </Link>
      </motion.div>
    </div>
  );
}
