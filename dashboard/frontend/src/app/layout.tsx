import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Max-Hygiene',
    default: 'Max-Hygiene',
  },
  description: 'Professional cleaning services in Glasgow and surroundings.',
  icons: {
    icon: '/images/logo1.png',
    apple: '/images/logo1.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
