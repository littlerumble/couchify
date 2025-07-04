'use client';

import Link from 'next/link';
import { Sofa } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { toast } = useToast();

  const handleComingSoon = () => {
    toast({
      title: 'Coming Soon!',
      description: 'This feature is under construction.',
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sofa className="h-6 w-6 text-primary" />
          <span className="font-headline text-lg font-semibold">$COUCH on Solana</span>
        </Link>
        <nav className="flex items-center gap-4">
           <Button onClick={handleComingSoon}>
              Buy $COUCH
            </Button>
        </nav>
      </div>
    </header>
  );
}
