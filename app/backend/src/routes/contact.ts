import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, service, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ success: false, error: 'name, email and message are required' });
    return;
  }
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const adminEmail = process.env.ADMIN_EMAIL || 'atikuquadrisegun@gmail.com';
    await transport.sendMail({
      from: `"${process.env.FROM_NAME || 'Max-Hygiene'}" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: `Website Enquiry from ${name}`,
      html: `
        <div style="font-family:Poppins,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#3bb0bd">New Website Enquiry</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:600;background:#f7fafc">Name</td><td style="padding:8px">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:600;background:#f7fafc">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px;font-weight:600;background:#f7fafc">Phone</td><td style="padding:8px">${phone}</td></tr>` : ''}
            ${service ? `<tr><td style="padding:8px;font-weight:600;background:#f7fafc">Service</td><td style="padding:8px">${service}</td></tr>` : ''}
            <tr><td style="padding:8px;font-weight:600;background:#f7fafc">Message</td><td style="padding:8px">${message.replace(/\n/g,'<br>')}</td></tr>
          </table>
        </div>`,
    });
    res.json({ success: true });
  } catch (err: unknown) {
    console.error('Contact email error:', err);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

export default router;
