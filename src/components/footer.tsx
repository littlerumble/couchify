'use client';

import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export function Footer() {
  const { toast } = useToast();

  const handleComingSoon = () => {
    toast({
      title: 'Coming Soon!',
      description: 'This feature is under construction.',
    });
  };

  return (
    <footer className="w-full border-t bg-secondary/50">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ by the $COUCH community.
          </p>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleComingSoon}>
                <XIcon className="h-5 w-5" />
                <span className="sr-only">X</span>
            </Button>
        </div>
      </div>
      <div className="container pb-8 text-center text-xs text-muted-foreground">
        Disclaimer: This is a fun meme AI tool. Do your own research before investing.
      </div>
    </footer>
  );
}
