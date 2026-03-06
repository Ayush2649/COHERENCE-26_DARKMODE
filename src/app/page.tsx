/**
 * Home page - AI Outreach Automation Engine
 * MVC: View layer - entry point for the app
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          AI Outreach Automation Engine
        </h1>
        <p className="text-lg text-muted-foreground">
          Mailchimp-style outreach automation with a visual workflow builder and
          AI-generated messaging.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button asChild>
            <Link href="/leads">Upload Leads</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/workflow">Workflow Builder</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/ai-message">AI Message Generator</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/campaign">Campaign Simulator</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-12">
          Steps 1–6 done. Time simulation • Monitoring dashboard next.
        </p>
      </div>
    </main>
  );
}
