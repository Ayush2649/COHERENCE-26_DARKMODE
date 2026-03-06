/**
 * Landing Page (MVC: View Layer)
 * 
 * The main entry point / hub for the AI Outreach Engine.
 * Displays:
 * - Hero section with gradient text and call-to-action
 * - Feature cards linking to each main view
 * - Architecture overview badges
 * - Animated background grid
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";

/* Feature cards data — one for each view */
const features = [
  {
    href: "/leads",
    icon: "📤",
    title: "Upload Leads",
    description:
      "Import contacts via CSV upload. Parse, preview, and save leads to your database in seconds.",
    badge: "Step 3",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "hover:border-blue-500/50",
  },
  {
    href: "/workflows",
    icon: "🔀",
    title: "Workflow Builder",
    description:
      "Drag-and-drop visual workflow builder. Create Mailchimp-style automation flows with conditions and delays.",
    badge: "Step 4",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "hover:border-purple-500/50",
  },
  {
    href: "/ai-generator",
    icon: "🤖",
    title: "AI Message Generator",
    description:
      "Generate personalized cold outreach emails using OpenAI. Inject lead data for hyper-personalization.",
    badge: "Step 5",
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "hover:border-emerald-500/50",
  },
  {
    href: "/campaigns",
    icon: "🚀",
    title: "Campaign Simulator",
    description:
      "Start campaigns and watch leads flow through your workflow in real-time with time simulation.",
    badge: "Step 6-7",
    color: "from-orange-500/20 to-amber-500/20",
    borderColor: "hover:border-orange-500/50",
  },
  {
    href: "/dashboard",
    icon: "📊",
    title: "Monitoring Dashboard",
    description:
      "Track emails sent, follow-ups, reply rates, and campaign progress with live-updating charts.",
    badge: "Step 8",
    color: "from-rose-500/20 to-red-500/20",
    borderColor: "hover:border-rose-500/50",
  },
];

/* Architecture badges */
const techStack = [
  "Next.js",
  "TailwindCSS",
  "ShadCN UI",
  "React Flow",
  "OpenAI",
  "SQLite",
  "MVC",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-grid bg-radial-gradient">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Status badge */}
          <div className="mb-6 flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 backdrop-blur-sm">
            <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Hackathon MVP — v1.0
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">AI Outreach</span>
            <br />
            <span className="text-foreground">Automation Engine</span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            A Mailchimp-style outreach automation platform with a visual
            workflow builder and AI-generated messaging. Build campaigns,
            upload leads, and automate outreach at scale.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex items-center gap-4">
            <Link href="/leads">
              <Button size="lg" className="gap-2 text-base px-8">
                <span>📤</span> Upload Leads
              </Button>
            </Link>
            <Link href="/workflows">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base px-8"
              >
                <span>🔀</span> Build Workflow
              </Button>
            </Link>
          </div>

          {/* Tech Stack Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl opacity-50" />

      {/* Feature Cards Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">
            Everything You Need for{" "}
            <span className="gradient-text">Smart Outreach</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Five powerful modules working together in an MVC architecture.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group">
              <Card
                className={`relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 ${feature.borderColor} hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1`}
              >
                {/* Gradient overlay */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />

                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{feature.icon}</span>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative">
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Architecture card — special */}
          <Card className="relative h-full overflow-hidden border-dashed border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="relative">
              <span className="text-3xl">🏗️</span>
              <CardTitle className="mt-3 text-xl">MVC Architecture</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <CardDescription className="text-sm leading-relaxed">
                <strong className="text-foreground">Models:</strong> Lead, Workflow, Campaign, EmailLog
                <br />
                <strong className="text-foreground">Controllers:</strong> Lead, Workflow, Campaign, AI
                <br />
                <strong className="text-foreground">Views:</strong> 5 pages with ShadCN components
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            AI Outreach Engine — Built with ⚡ for Hackathon MVP
          </p>
        </div>
      </footer>
    </div>
  );
}
