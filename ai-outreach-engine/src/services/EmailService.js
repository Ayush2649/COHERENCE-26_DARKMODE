/**
 * Email Service — Real Gmail Sending via OAuth2
 *
 * Uses Nodemailer + Google OAuth2 to send real emails through Gmail.
 * Falls back to simulation (console log) if credentials are missing.
 */
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const GMAIL_USER = process.env.GMAIL_USER;
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

const hasCredentials = !!(GMAIL_USER && CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);

if (!hasCredentials) {
  console.warn("[EmailService] Gmail credentials missing — emails will be SIMULATED (logged to console).");
}

const oAuth2Client = hasCredentials
  ? new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "https://developers.google.com/oauthplayground")
  : null;

if (oAuth2Client) {
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

const EmailService = {
  /**
   * Send a real email via Gmail OAuth2.
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML email body
   * @returns {{ success: boolean, messageId?: string, error?: string }}
   */
  async sendEmail(to, subject, htmlBody) {
    if (!hasCredentials) {
      // Simulation mode — log to console
      console.log(`[EmailService SIMULATED] To: ${to} | Subject: ${subject}`);
      return { success: true, messageId: `simulated_${Date.now()}`, simulated: true };
    }

    try {
      // Get fresh access token from refresh token
      const { token } = await oAuth2Client.getAccessToken();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: GMAIL_USER,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: token,
        },
      });

      const mailOptions = {
        from: `AI Outreach <${GMAIL_USER}>`,
        to,
        subject,
        html: htmlBody,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] ✅ Sent to ${to} | MessageId: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`[EmailService] ❌ Failed to send to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  },
};

module.exports = EmailService;
