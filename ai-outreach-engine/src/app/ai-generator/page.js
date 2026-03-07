import { Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AIGeneratorPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-row items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">AI Message Generator</CardTitle>
              <CardDescription className="mt-1">
                Generate personalized outreach with OpenAI. Use prompt, role, and campaign context.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enter a prompt, role, and campaign context to generate cold outreach emails. Lead data can be injected for personalization.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
