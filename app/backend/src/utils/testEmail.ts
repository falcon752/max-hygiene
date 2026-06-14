import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ADMIN_EMAIL'] as const;
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required email env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const port = Number(process.env.SMTP_PORT);
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function main() {
  await transport.verify();

  const info = await transport.sendMail({
    from: `"${process.env.FROM_NAME || 'Max-Hygiene'}" <${process.env.SMTP_USER}>`,
    to: process.env.TEST_EMAIL_TO || process.env.ADMIN_EMAIL,
    replyTo: process.env.SMTP_USER,
    subject: `Max-Hygiene SMTP test - ${new Date().toISOString()}`,
    text: 'This is a test email from the Max-Hygiene website backend SMTP configuration.',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Max-Hygiene SMTP test</h2>
        <p>This email confirms the website backend can send mail through the configured SMTP account.</p>
        <p><strong>SMTP user:</strong> ${process.env.SMTP_USER}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString('en-GB')}</p>
      </div>
    `,
  });

  console.log(`SMTP test sent: ${info.messageId}`);
}

main().catch((err) => {
  console.error('SMTP test failed:', err);
  process.exit(1);
});
