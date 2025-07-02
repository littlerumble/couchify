'use client';

import Link from 'next/link';
import { Sofa } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sofa className="h-6 w-6 text-primary" />
          <span className="font-headline text-lg font-semibold">Couch Vibes</span>
        </Link>
        <nav className="flex items-center gap-4">
           <Button asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              Buy $COUCH
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
