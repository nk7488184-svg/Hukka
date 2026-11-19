import type { Metadata } from 'next';
import '@/lib/suppressMediaPipeLogs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hookah Baar — Virtual Hookah Experience',
  description: 'An interactive virtual hookah experience with hand tracking, face detection, and blow-activated smoke effects.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
