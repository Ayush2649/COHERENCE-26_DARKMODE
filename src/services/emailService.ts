/**
 * Email Service - sends real emails via Resend.
 * Set RESEND_API_KEY and optionally RESEND_FROM in .env.local to send to real addresses.
 */

import { Resend } from "resend";

const FROM_DEFAULT = "Outreach <onboarding@resend.dev>";

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

/**
 * Send one email via Resend.
 * - If RESEND_API_KEY is not set, returns { sent: false } (no-op for local testing without Resend).
 * - From address: RESEND_FROM env or "Outreach <onboarding@resend.dev>" (Resend's test sender).
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not set" };
  }

  const from = process.env.RESEND_FROM ?? FROM_DEFAULT;

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html: body.replace(/\n/g, "<br>"),
  });

  if (error) {
    return { sent: false, error: error.message };
  }
  return { sent: true };
}
