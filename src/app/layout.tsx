import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { promises as fs } from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: '$COUCH on Solana',
  description: 'Create memes for $COUCH by uploading any image.',
};

async function getFaviconDataUri(): Promise<string> {
  try {
    const imagePath = path.join(process.cwd(), 'src', 'ai', '5989857315257436567.jpg');
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error("Failed to read favicon file:", error);
    // Return a default or empty value if the file can't be read.
    return 'data:image/x-icon;base64,'; 
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const faviconHref = await getFaviconDataUri();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href={faviconHref} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Lobster&family=Montserrat:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased'
        )}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
