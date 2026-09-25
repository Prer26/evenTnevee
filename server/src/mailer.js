import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
const isConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Sends an email if SMTP is configured (e.g. a free Gmail app password —
 * see server/.env.example). Otherwise just logs to the console so local
 * dev/testing still works without any paid service.
 */
export async function sendMail({ to, subject, text }) {
  if (!isConfigured) {
    console.log(`\n--- [DEV EMAIL — no SMTP configured] ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n-----------------------------------------\n`);
    return { delivered: false };
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
  });
  return { delivered: true };
}

export const emailConfigured = isConfigured;
