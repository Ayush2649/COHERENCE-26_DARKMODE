/**
 * AI Message Generator Page — Placeholder (MVC: View Layer)
 * Will be fully implemented in Step 5
 */
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIGeneratorPage() {
  return (
    <div className="min-h-screen bg-grid bg-radial-gradient">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <CardTitle className="text-2xl">AI Message Generator</CardTitle>
                <CardDescription>Generate personalized outreach with OpenAI</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="w-fit mt-2">Coming in Step 5</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Enter a prompt, role, and campaign context to generate hyper-personalized
              cold outreach emails using the OpenAI API.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
