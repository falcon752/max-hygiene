import nodemailer from 'nodemailer';

const getTransport = () => {
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendLeadEmail = async (data: {
  name: string;
  email: string;
  phone: string;
}): Promise<void> => {
  const transport = getTransport();
  const adminEmail = process.env.ADMIN_EMAIL || 'atikuquadrisegun@gmail.com';
  await transport.sendMail({
    from: `"${process.env.FROM_NAME || 'Max-Hygiene'}" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `New Lead: ${data.name} — Max-Hygiene`,
    html: `
      <div style="font-family:Poppins,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#3bb0bd">New Lead Received</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:600">Name</td><td style="padding:8px">${data.name}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Email</td><td style="padding:8px">${data.email}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Phone</td><td style="padding:8px">${data.phone}</td></tr>
          <tr><td style="padding:8px;font-weight:600">Time</td><td style="padding:8px">${new Date().toLocaleString('en-GB')}</td></tr>
        </table>
      </div>`,
    text: `New Lead Received\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nTime: ${new Date().toLocaleString('en-GB')}`,
  });
};

export const sendBookingEmails = async (booking: {
  ref: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  address: { line1: string; city: string; postcode: string };
  service: { name: string };
  pricingType: string;
  rooms: { name: string; qty: number; price: number }[];
  extras: { name: string; price: number }[];
  hours: number;
  hourlyDescription: string;
  frequency: string;
  date: Date;
  timeSlot: string;
  notes: string;
  basePrice: number;
  discount: number;
  extrasTotal: number;
  totalPrice: number;
  propertyType: string;
}): Promise<void> => {
  const transport = getTransport();
  const adminEmail = process.env.ADMIN_EMAIL || 'atikuquadrisegun@gmail.com';
  const fromName = process.env.FROM_NAME || 'Max-Hygiene Bookings';
  const fromAddr = process.env.SMTP_USER || '';

  const dateStr = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const freqLabels: Record<string, string> = {
    once: 'One-Time',
    weekly: 'Weekly',
    biweekly: 'Every 2 Weeks',
    monthly: 'Monthly',
  };

  const roomsHtml =
    booking.rooms.length > 0
      ? booking.rooms
          .map(
            (r) =>
              `<tr><td style="padding:6px 8px">${r.name} x${r.qty}</td><td style="padding:6px 8px;text-align:right">£${(r.price * r.qty).toFixed(2)}</td></tr>`
          )
          .join('')
      : `<tr><td colspan="2" style="padding:6px 8px">${booking.hours}hrs @ hourly rate</td></tr>`;

  const extrasHtml = booking.extras
    .map(
      (e) =>
        `<tr><td style="padding:6px 8px">${e.name}</td><td style="padding:6px 8px;text-align:right">£${e.price.toFixed(2)}</td></tr>`
    )
    .join('');

  const adminHtml = `
    <div style="font-family:Poppins,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f7fafc;border-radius:12px">
      <div style="background:#3bb0bd;padding:20px 24px;border-radius:8px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:1.4rem">New Booking — ${booking.service.name}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0">Ref: ${booking.ref}</p>
      </div>
      <h3 style="color:#2d3748;margin:0 0 12px">Customer Details</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:20px">
        <tr><td style="padding:8px 12px;font-weight:600;width:40%;background:#f7fafc">Name</td><td style="padding:8px 12px">${booking.customer.firstName} ${booking.customer.lastName}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Email</td><td style="padding:8px 12px">${booking.customer.email}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Phone</td><td style="padding:8px 12px">${booking.customer.phone}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Address</td><td style="padding:8px 12px">${booking.address.line1}, ${booking.address.city}, ${booking.address.postcode}</td></tr>
      </table>
      <h3 style="color:#2d3748;margin:0 0 12px">Booking Details</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:20px">
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Service</td><td style="padding:8px 12px">${booking.service.name}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Property</td><td style="padding:8px 12px">${booking.propertyType}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Pricing</td><td style="padding:8px 12px">${booking.pricingType === 'hourly' ? `Hourly (${booking.hours}hrs)` : 'Flat Rate'}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Frequency</td><td style="padding:8px 12px">${freqLabels[booking.frequency] || booking.frequency}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Date</td><td style="padding:8px 12px">${dateStr}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Time</td><td style="padding:8px 12px">${booking.timeSlot}</td></tr>
        ${booking.hourlyDescription ? `<tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">${booking.pricingType === 'hourly' ? 'Task Description' : 'Quote Details'}</td><td style="padding:8px 12px">${booking.hourlyDescription.replace(/\n/g, '<br>')}</td></tr>` : ''}
        ${booking.notes ? `<tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Notes</td><td style="padding:8px 12px">${booking.notes}</td></tr>` : ''}
      </table>
      <h3 style="color:#2d3748;margin:0 0 12px">Price Breakdown</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden">
        ${roomsHtml}
        ${extrasHtml}
        ${booking.discount > 0 ? `<tr><td style="padding:6px 8px;color:#00d97e">Frequency Discount</td><td style="padding:6px 8px;text-align:right;color:#00d97e">-£${booking.discount.toFixed(2)}</td></tr>` : ''}
        <tr style="border-top:2px solid #e2e8f0"><td style="padding:10px 8px;font-weight:700;font-size:1.1rem">TOTAL</td><td style="padding:10px 8px;text-align:right;font-weight:700;font-size:1.1rem;color:#3bb0bd">£${booking.totalPrice.toFixed(2)}</td></tr>
      </table>
    </div>`;

  const clientHtml = `
    <div style="font-family:Poppins,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f7fafc;border-radius:12px">
      <div style="background:#3bb0bd;padding:20px 24px;border-radius:8px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:1.4rem">Booking Confirmed!</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0">Reference: ${booking.ref}</p>
      </div>
      <p style="color:#4a5568">Hi ${booking.customer.firstName},</p>
      <p style="color:#4a5568">Thank you for booking with Max-Hygiene. Here's a summary of your booking:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin-bottom:20px">
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Service</td><td style="padding:8px 12px">${booking.service.name}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Date</td><td style="padding:8px 12px">${dateStr}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Time</td><td style="padding:8px 12px">${booking.timeSlot}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Address</td><td style="padding:8px 12px">${booking.address.line1}, ${booking.address.city}, ${booking.address.postcode}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:600;background:#f7fafc">Estimated Cost</td><td style="padding:8px 12px;color:#3bb0bd;font-weight:600">£${booking.totalPrice.toFixed(2)}</td></tr>
      </table>
      <div style="background:#e6f9f1;border-left:4px solid #00d97e;padding:12px 16px;border-radius:4px;margin-bottom:20px">
        <strong>No payment required today.</strong> Payment will be arranged on the day of service.
      </div>
      <p style="color:#4a5568">If you have any questions, please contact us:</p>
      <p style="color:#4a5568">Phone: <a href="tel:+447743173136" style="color:#3bb0bd">+44 7743 173136</a><br>
      Email: <a href="mailto:MaxHygiene100@gmail.com" style="color:#3bb0bd">MaxHygiene100@gmail.com</a></p>
      <p style="color:#718096;font-size:0.85rem">Max-Hygiene Cleaning Services<br>Technology House, 9 Newton Place, Glasgow G3 7PR</p>
    </div>`;

  const adminText = `New Booking — ${booking.service.name}\nRef: ${booking.ref}\n\nCustomer Details:\nName: ${booking.customer.firstName} ${booking.customer.lastName}\nEmail: ${booking.customer.email}\nPhone: ${booking.customer.phone}\nAddress: ${booking.address.line1}, ${booking.address.city}, ${booking.address.postcode}\n\nTotal Price: £${booking.totalPrice.toFixed(2)}`;
  const clientText = `Hi ${booking.customer.firstName},\n\nThank you for booking with Max-Hygiene.\n\nYour Booking Reference: ${booking.ref}\nService: ${booking.service.name}\nDate: ${dateStr}\nTime: ${booking.timeSlot}\n\nEstimated Cost: £${booking.totalPrice.toFixed(2)}\n\nNo payment required today. Payment will be arranged on the day of service.\n\nMax-Hygiene Cleaning Services`;

  await Promise.all([
    transport.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: adminEmail,
      subject: `New Booking: ${booking.service.name} — ${booking.customer.firstName} ${booking.customer.lastName}`,
      html: adminHtml,
      text: adminText,
    }),
    transport.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: booking.customer.email,
      subject: `Your Max-Hygiene Booking — ${booking.ref}`,
      html: clientHtml,
      text: clientText,
    }),
  ]);
};
