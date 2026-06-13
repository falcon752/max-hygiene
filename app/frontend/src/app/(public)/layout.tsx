'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './public.css';

const NAV_LINKS = [
  { href: '/#home', id: 'home', icon: 'fas fa-home', label: 'Home' },
  { href: '/#services', id: 'services', icon: 'fas fa-broom', label: 'Services' },
  { href: '/#why-choose-us', id: 'why-choose-us', icon: 'fas fa-star', label: 'Why Choose Us' },
  { href: '/#about', id: 'about', icon: 'fas fa-info-circle', label: 'About' },
  { href: '/#contact', id: 'contact', icon: 'fas fa-envelope', label: 'Contact' },
  { href: '/booking', id: 'booking', icon: 'fas fa-calendar-check', label: 'Book Now' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // Close sidebar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll-based nav shadow
  useEffect(() => {
    const onScroll = () => {
      const nav = document.querySelector('.sidebar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== '/') return;

    const sections = NAV_LINKS
      .filter(link => link.href.startsWith('/#'))
      .map(link => document.getElementById(link.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0.1, 0.25, 0.5, 0.75] }
    );

    sections.forEach(section => observer.observe(section));

    const hash = window.location.hash.slice(1);
    if (hash && sections.some(section => section.id === hash)) setActiveSection(hash);

    return () => observer.disconnect();
  }, [pathname]);

  const close = () => setOpen(false);

  const handleNavClick = (href: string, id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    close();
    if (pathname !== '/' || !href.startsWith('/#')) return;

    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    setActiveSection(id);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-container">
          <div className="mobile-logo">
            <img src="/images/logo1.png" alt="Max-Hygiene Logo" />
          </div>
          <button className="mobile-menu-toggle" onClick={() => setOpen(o => !o)}>
            <i className="fas fa-bars" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <nav ref={sidebarRef} className={`sidebar${open ? ' active' : ''}`}>
        <div className="logo">
          <img src="/images/logo1.png" alt="Max-Hygiene Logo" className="logo-img" />
        </div>
        <ul className="nav-links">
          {NAV_LINKS.map(({ href, id, icon, label }) => {
            const isActive = href === '/booking'
              ? pathname === '/booking'
              : pathname === '/' && activeSection === id;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={isActive ? 'active' : ''}
                  onClick={handleNavClick(href, id)}
                >
                  <i className={icon} /> {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="social-links">
          <a href="#" aria-label="Facebook"><i className="fab fa-facebook" /></a>
          <a href="#" aria-label="Twitter"><i className="fab fa-twitter" /></a>
          <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
        </div>
      </nav>

      {/* Desktop menu toggle */}
      <div className="menu-btn" onClick={() => setOpen(o => !o)}>
        <i className="fas fa-bars" />
      </div>

      {/* Page content */}
      <main className="main-content">
        {children}

        {/* Footer */}
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-section">
              <div className="footer-logo">
                <img src="/images/logo2.jpeg" alt="Max-Hygiene Logo" />
                <p>Professional cleaning services across Scotland.</p>
              </div>
              <div className="footer-social">
                <a href="#" target="_blank" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
                <a href="#" target="_blank" aria-label="Twitter"><i className="fab fa-twitter" /></a>
                <a href="#" target="_blank" aria-label="Instagram"><i className="fab fa-instagram" /></a>
              </div>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><Link href="/#home" onClick={close}>Home</Link></li>
                <li><Link href="/#services" onClick={close}>Services</Link></li>
                <li><Link href="/#about" onClick={close}>About Us</Link></li>
                <li><Link href="/#contact" onClick={close}>Contact</Link></li>
                <li><Link href="/booking">Book Now</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Our Services</h3>
              <ul className="footer-links">
                <li><Link href="/#services">Residential Cleaning</Link></li>
                <li><Link href="/#services">Commercial Cleaning</Link></li>
                <li><Link href="/#services">Deep Cleaning</Link></li>
                <li><Link href="/#services">Short-let / Airbnb</Link></li>
                <li><Link href="/#services">End of Tenancy</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Contact Us</h3>
              <div className="footer-contact">
                <p><i className="fas fa-map-marker-alt" /> Technology House, 9 Newton Place, Glasgow G3 7PR</p>
                <p><i className="fas fa-phone" /> +44 7743173136</p>
                <p><i className="fas fa-envelope" /> MaxHygiene100@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="container">
              <p>&copy; {year} Max-Hygiene. All Rights Reserved.</p>
              <div className="footer-legal">
                <a href="#">Privacy Policy</a>
                <span>|</span>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/447743173136"
        className="floating-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <i className="fab fa-whatsapp" />
      </a>
    </>
  );
}
