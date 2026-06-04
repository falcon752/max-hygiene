const fs = require('fs');
let html = fs.readFileSync('booking.html', 'utf8');

// Extract body content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
  console.error('No body found');
  process.exit(1);
}
let bodyContent = bodyMatch[1];

// Extract script blocks inside body
let scripts = [];
bodyContent = bodyContent.replace(/<script>([\s\S]*?)<\/script>/gi, (match, p1) => {
  scripts.push(p1);
  return '';
});

// Also grab script tags with src
bodyContent = bodyContent.replace(/<script[^>]+src="([^"]+)"[^>]*><\/script>/gi, '');

// Convert class to className
bodyContent = bodyContent.replace(/class=/g, 'className=');
bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');
bodyContent = bodyContent.replace(/onclick=/gi, 'onClick=');
bodyContent = bodyContent.replace(/onchange=/gi, 'onChange=');
bodyContent = bodyContent.replace(/onsubmit=/gi, 'onSubmit=');

// Convert self-closing tags
bodyContent = bodyContent.replace(/<img([^>]+[^\/])>/g, '<img$1 />');
bodyContent = bodyContent.replace(/<input([^>]+[^\/])>/g, '<input$1 />');
bodyContent = bodyContent.replace(/<br>/g, '<br />');

// Remove remaining HTML comments
bodyContent = bodyContent.replace(/<!--([\s\S]*?)-->/g, '{/*\$1*/}');

// Convert inline styles
bodyContent = bodyContent.replace(/style="([^"]*)"/g, (match, p1) => {
  const reactStyle = p1.split(';').filter(Boolean).map(s => {
    let [k, v] = s.split(':');
    if (!v) return '';
    k = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
    v = v.trim();
    if (!isNaN(v) && v !== '') {
      return `${k}: ${v}`;
    }
    return `${k}: '${v}'`;
  }).filter(Boolean).join(', ');
  return `style={{${reactStyle}}}`;
});

// Save the scripts to a separate file so we can load it in the component
fs.writeFileSync('dashboard/frontend/public/js/booking-logic.js', scripts.join('\n\n'));

const component = `
'use client';
import { useEffect } from 'react';
import Script from 'next/script';

export default function Booking() {
  return (
    <>
      ${bodyContent}
      <Script src="/js/booking-logic.js" strategy="lazyOnload" />
    </>
  );
}
`;

fs.mkdirSync('dashboard/frontend/src/app/(public)/booking', { recursive: true });
fs.writeFileSync('dashboard/frontend/src/app/(public)/booking/page.tsx', component);
console.log('Successfully converted booking.html to booking/page.tsx');
