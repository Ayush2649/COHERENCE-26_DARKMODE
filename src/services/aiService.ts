/**
 * AI Service - MVC: Service layer
 * Builds the system prompt and calls OpenAI to generate outreach messages.
 */

import OpenAI from "openai";

export interface GenerateMessageInput {
  prompt: string;
  role: string;
  campaignContext?: string;
  leadData?: { name?: string; company?: string; role?: string };
}

/**
 * Build the system + user prompt for OpenAI.
 * Prompt engineering: system message sets role and rules; user message includes
 * the task, campaign context, and lead data for personalization.
 */
export function buildMessages(input: GenerateMessageInput): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemContent = [
    `You are writing as: ${input.role}.`,
    "Write a single email body only, no subject line, no signatures. Be concise and professional.",
    input.campaignContext ? `Campaign context: ${input.campaignContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const leadPart =
    input.leadData && (input.leadData.name || input.leadData.company || input.leadData.role)
      ? `\nLead to personalize for: ${[input.leadData.name, input.leadData.company, input.leadData.role].filter(Boolean).join(", ")}.`
      : "";

  const userContent = `${input.prompt}${leadPart}`.trim();

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}

/**
 * Call OpenAI to generate one outreach message.
 */
export async function generateMessage(input: GenerateMessageInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.local.");
  }

  const openai = new OpenAI({ apiKey });
  const messages = buildMessages(input);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }
  return content;
}
