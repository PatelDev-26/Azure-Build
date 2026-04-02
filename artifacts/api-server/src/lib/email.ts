import nodemailer from "nodemailer";
import { logger } from "./logger";

const { SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT, SMTP_FROM } = process.env;

function isConfigured() {
  return !!(SMTP_USER && SMTP_PASS);
}

function createTransport() {
  if (!isConfigured()) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST ?? "smtp.gmail.com",
    port: SMTP_PORT ? parseInt(SMTP_PORT) : 587,
    secure: false,
    auth: { user: SMTP_USER!, pass: SMTP_PASS! },
    tls: { rejectUnauthorized: false },
  });
}

export interface SendOtpResult {
  sent: boolean;
  devOtp?: string;
}

export async function sendOtpEmail(to: string, otp: string): Promise<SendOtpResult> {
  const transport = createTransport();

  if (!transport) {
    logger.warn(
      { to },
      "SMTP not configured (set SMTP_USER + SMTP_PASS). OTP returned in API response for development."
    );
    return { sent: false, devOtp: otp };
  }

  try {
    await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to,
      subject: "PhotoShare — Your Password Reset Code",
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: auto; background: #0d0d0d; padding: 32px; border-radius: 12px; color: #f5f5f5;">
          <h2 style="color: #f59e0b; font-size: 1.5rem; margin-bottom: 8px;">PhotoShare</h2>
          <p style="color: #d4d4d4; margin-bottom: 24px;">
            You requested a password reset. Use the code below — it expires in <strong>10 minutes</strong>.
          </p>
          <div style="font-size: 2.8rem; font-weight: 700; letter-spacing: 0.4em; color: #f59e0b;
                      text-align: center; background: #1a1a1a; border-radius: 8px;
                      padding: 24px; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #737373; font-size: 0.85rem;">
            If you didn't request this, you can safely ignore this email.<br/>
            This code is valid for 10 minutes only.
          </p>
        </div>
      `,
    });
    logger.info({ to }, "OTP email sent successfully");
    return { sent: true };
  } catch (err) {
    logger.error({ err, to }, "Failed to send OTP email");
    return { sent: false, devOtp: otp };
  }
}
