const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Extract body content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) {
  console.error('No body found');
  process.exit(1);
}
let bodyContent = bodyMatch[1];

// Convert class to className
bodyContent = bodyContent.replace(/class=/g, 'className=');

// Convert self-closing tags
bodyContent = bodyContent.replace(/<img([^>]+[^\/])>/g, '<img$1 />');
bodyContent = bodyContent.replace(/<input([^>]+[^\/])>/g, '<input$1 />');
bodyContent = bodyContent.replace(/<br>/g, '<br />');

// Remove scripts and inline event handlers
bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');
bodyContent = bodyContent.replace(/onsubmit="[^"]*"/g, '');
bodyContent = bodyContent.replace(/style="([^"]*)"/g, (match, p1) => {
  const reactStyle = p1.split(';').filter(Boolean).map(s => {
    let [k, v] = s.split(':');
    if (!v) return '';
    k = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
    v = v.trim();
    return `${k}: '${v}'`;
  }).filter(Boolean).join(', ');
  return `style={{${reactStyle}}}`;
});

const component = `
'use client';
import { useEffect } from 'react';
import Head from 'next/head';
import '../public/css/style.css';

export default function Home() {
  useEffect(() => {
    // Add script logic here if necessary
    const script = document.createElement('script');
    script.src = '/js/script.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Max-Hygiene - Professional Cleaning Services</title>
      </Head>
      ${bodyContent}
    </>
  );
}
`;

fs.writeFileSync('dashboard/frontend/src/app/page.tsx', component);
console.log('Successfully converted index.html to page.tsx');
