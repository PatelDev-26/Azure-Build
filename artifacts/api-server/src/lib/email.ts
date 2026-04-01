import nodemailer from "nodemailer";
import { logger } from "./logger";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

function createTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT) : 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    logger.warn(
      { to, otp },
      "SMTP not configured — OTP logged here (development only). Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable email."
    );
    return;
  }

  await transport.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to,
    subject: "PhotoShare — your password reset code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #b45309;">PhotoShare</h2>
        <p>You requested a password reset. Use the code below — it expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 2.5rem; font-weight: bold; letter-spacing: 0.3em; color: #1a1a1a; margin: 32px 0; text-align: center; background: #f5f5f5; border-radius: 8px; padding: 24px;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 0.875rem;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
