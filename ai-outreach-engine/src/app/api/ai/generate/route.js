/**
 * AI Message Generation API Route (MVC: Controller)
 * 
 * POST /api/ai/generate
 * Generates personalized email content using OpenAI based on lead data and a prompt template.
 */
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// Initialize OpenAI client
// Note: In production, ensure process.env.OPENAI_API_KEY is mapped correctly
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-ui-testing",
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { promptTemplate, lead } = body;

    if (!promptTemplate || !lead || !lead.name) {
      return NextResponse.json(
        { success: false, error: "Prompt template and lead data are required" },
        { status: 400 }
      );
    }

    // Replace variables in the prompt template with actual lead data
    const personalizedPrompt = promptTemplate
      .replace(/{{name}}/g, lead.name)
      .replace(/{{company}}/g, lead.company || "your company")
      .replace(/{{role}}/g, lead.role || "your role");

    const systemPrompt = `You are an expert B2B sales copywriter. Write a highly effective, concise, and personalized cold outreach email based on the provided instructions. 
    Return ONLY a JSON object with two fields: "subject" (string) and "body" (string formatted with basic HTML like <p>, <br>). No other text.`;

    // For Hackathon MVP: If there's no real API key, return a mock response to prevent breaking the flow
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy-key-for-ui-testing") {
      // Small artificial delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockSubject = `Quick question regarding ${lead.company || 'your team'}`;
      const mockBody = `<p>Hi ${lead.name},</p><p>I noticed your work as ${lead.role || 'a leader'} at ${lead.company || 'your company'} and wanted to reach out.</p><p>We help teams like yours automate their outreach. Would you be open to a 5-minute chat next week to see if there's a fit?</p><p>Best,<br>Alex</p>`;
      
      return NextResponse.json({
        success: true,
        data: {
          subject: mockSubject,
          body: mockBody,
          isMock: true
        }
      });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for speed and cost-effectiveness
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: personalizedPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return NextResponse.json({
      success: true,
      data: {
        subject: result.subject,
        body: result.body,
        isMock: false
      }
    });

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI message" },
      { status: 500 }
    );
  }
}
