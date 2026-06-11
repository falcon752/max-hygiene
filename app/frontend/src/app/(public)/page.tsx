'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const SERVICES = [
  { icon: 'fas fa-home',         title: 'Residential Standard Clean', desc: 'Keep your home fresh and tidy with our regular maintenance cleaning.', features: ['Weekly, bi-weekly, or monthly options','Dusting, vacuuming, and mopping','Kitchen and bathroom maintenance','Customisable cleaning plans'] },
  { icon: 'fas fa-broom',        title: 'Residential Deep Clean',     desc: 'Intensive top-to-bottom clean for a thorough refresh of your home.', features: ['Detailed cleaning of all areas','Skirting boards and window sills','Appliance interior cleaning','Ideal for spring cleans or move-ins'] },
  { icon: 'fas fa-building',     title: 'Commercial Cleaning',         desc: 'Professional workspace cleaning for a productive, hygienic environment.', features: ['After-hours cleaning available','Sanitisation of high-touch areas','Restroom and break room maintenance','Flexible scheduling'] },
  { icon: 'fas fa-key',          title: 'Short-let / Airbnb',          desc: 'Fast, reliable turnaround cleaning to get your property guest-ready.', features: ['Between-guest deep refresh','Linen and bed changing available','Restocking of essentials','Flexible same-day availability'] },
  { icon: 'fas fa-truck-moving', title: 'End of Tenancy Cleaning',     desc: 'Comprehensive clean to ensure your full deposit return.', features: ['Full property cleaned to landlord standard','Oven, fridge, and cabinet deep clean','Window and skirting board cleaning','Ready for inspection'] },
];

const WHY_US = [
  { icon: 'fas fa-tools',     title: 'Professional Expertise & Equipment', text: '"Everyone can clean, but not everyone can clean well". Our teams are professionally trained in the latest cleaning techniques and safety standards and use high-quality, professional-grade equipment and products to deliver superior results.' },
  { icon: 'fas fa-shield-alt',title: 'Reliability & Consistency',           text: 'Our professional staff are rigorously vetted (including PVG/DBS checks) and fully insured, ensuring a trustworthy and reliable service every time. We use systematic checklists and regular quality control checks to ensure a consistent, spotless result.' },
  { icon: 'fas fa-headset',   title: 'Exceptional Customer Service',        text: "We pride ourselves on clear communication and a client-centric approach. You'll have a dedicated point of contact who is readily available to address any concerns or last-minute requests promptly, day or night." },
  { icon: 'fas fa-tasks',     title: 'Tailored Cleaning Solutions',         text: "We don't offer a \"one-size-fits-all\" service. Instead, we provide customized cleaning plans designed around your specific requirements, schedule, and budget, whether you need a daily, weekly, or monthly service." },
  { icon: 'fas fa-heartbeat', title: 'Health & Safety Commitment',          text: 'We use eco-friendly and non-toxic cleaning products upon request, reducing harmful chemical exposure and improving indoor air quality. A cleaner space means reduced germs and illness, contributing to fewer sick days.' },
  { icon: 'fas fa-star',      title: 'Proven Reputation',                   text: 'Our high client retention rates and glowing testimonials speak for themselves. Our growth is largely driven by word-of-mouth recommendations, a testament to our commitment to quality and client satisfaction.' },
];

const ABOUT_CARDS = [
  { icon: 'fas fa-users',        title: 'Professional Team',      text: 'Our team consists of trained and vetted cleaning professionals committed to excellence in every service.' },
  { icon: 'fas fa-leaf',         title: 'Eco-Friendly',           text: 'We use environmentally friendly cleaning products that are safe for your family, pets, and the planet.' },
  { icon: 'fas fa-star',         title: '100% Satisfaction',      text: "Your satisfaction is our top priority. We're not happy until you're completely satisfied with our service." },
  { icon: 'fas fa-calendar-alt', title: 'Flexible Scheduling',    text: 'We work around your busy schedule to provide cleaning services at your convenience.' },
];

export default function HomePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleContact = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setForm({ name: '', email: '', phone: '', service: '', message: '' });
      } else {
        setSendError(data.error || 'Failed to send. Please try again.');
      }
    } catch {
      setSendError('Network error. Please email us directly at MaxHygiene100@gmail.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h1>Professional Cleaning Services in Glasgow and surroundings (30 Miles)</h1>
          <p>We provide top-quality cleaning services for homes and offices across Glasgow and surroundings (30 Miles). Book now and experience the difference!</p>
          <Link href="/booking" className="btn btn-primary" style={{ marginRight: '.75rem' }}>Book Now</Link>
          <a href="#contact" className="btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.6)' }}>Contact Us</a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section">
        <h2 className="section-title">Our Services</h2>
        <p className="subtitle">Professional cleaning solutions tailored to your needs</p>
        <div className="services-grid">
          {SERVICES.map(s => (
            <div key={s.title} className="feature-card">
              <div className="feature-icon"><i className={s.icon} /></div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <ul className="service-features">
                {s.features.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-choose-us" className="section" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container">
          <h2 className="section-title">Why Choose Us</h2>
          <p className="subtitle">Experience the difference with our professional cleaning services</p>
          <div className="features-grid">
            {WHY_US.map(w => (
              <div key={w.title} className="feature-card">
                <div className="feature-icon"><i className={w.icon} /></div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section">
        <div className="about-container">
          <div className="about-top-row">
            <div className="about-content">
              <h2 className="section-title">About Max-Hygiene</h2>
              <p>Max-Hygiene is a professional cleaning service company based in Glasgow, UK, dedicated to providing top-quality cleaning solutions for both residential and commercial properties. With several years of experience in the industry, we take pride in delivering exceptional service that exceeds our clients' expectations.</p>
            </div>
            <div className="about-image">
              <img
                src="https://plus.unsplash.com/premium_photo-1661663133172-02623c28fcef?w=500&auto=format&fit=crop&q=60"
                alt="Professional cleaning team at work"
              />
            </div>
          </div>
          <div className="about-grid">
            {ABOUT_CARDS.map(c => (
              <div key={c.title} className="about-card">
                <i className={c.icon} />
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section">
        <h2 className="section-title">Contact Us</h2>
        <div className="contact-container">
          <form className="contact-form" onSubmit={handleContact} noValidate>
            {sent && (
              <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
                <i className="fas fa-check-circle" style={{ marginRight: 8 }} />
                Thank you! We'll get back to you shortly.
              </div>
            )}
            {sendError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />
                {sendError}
              </div>
            )}
            <div className="form-group">
              <input type="text" value={form.name} onChange={setField('name')} required placeholder="Your Name" />
            </div>
            <div className="form-group">
              <input type="email" value={form.email} onChange={setField('email')} required placeholder="Your Email" />
            </div>
            <div className="form-group">
              <input type="tel" value={form.phone} onChange={setField('phone')} placeholder="Your Phone (Optional)" />
            </div>
            <div className="form-group">
              <select value={form.service} onChange={setField('service')} required>
                <option value="" disabled>Select a Service</option>
                <option value="residential-standard">Residential Standard Clean</option>
                <option value="residential-deep">Residential Deep Clean</option>
                <option value="commercial">Commercial Cleaning</option>
                <option value="shortlet">Short-let / Airbnb</option>
                <option value="endoftenancy">End of Tenancy Cleaning</option>
              </select>
            </div>
            <div className="form-group">
              <textarea value={form.message} onChange={setField('message')} rows={5} placeholder="Your Message" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>

          <div className="contact-info">
            <div className="info-item">
              <i className="fas fa-map-marker-alt" />
              <p>Technology House / 9 Newton Place<br />Glasgow, UK<br />Post code: G3 7PR</p>
            </div>
            <div className="info-item">
              <i className="fas fa-phone" />
              <p><a href="tel:+447743173136" className="contact-link">+44 7743173136</a></p>
            </div>
            <div className="info-item">
              <i className="fas fa-envelope" />
              <p><a href="mailto:MaxHygiene100@gmail.com" className="contact-link">MaxHygiene100@gmail.com</a></p>
            </div>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d17903.093807008815!2d-4.28165009020668!3d55.86360029569352!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x488846a3c3f1e8c7%3A0x9f2b5f7c8a9e9c3e!2sTechnology%20House%2C%209%20Newton%20Pl%2C%20Glasgow%20G3%207PR%2C%20UK!5e0!3m2!1sen!2suk!4v1640000000000!5m2!1sen!2suk"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Max-Hygiene Location"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
