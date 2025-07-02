'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ImageUploader } from '@/components/image-uploader';
import { RecentGallery } from '@/components/recent-gallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

type CouchImage = {
  src: string;
  alt: string;
  hint: string;
};

const initialImages: CouchImage[] = [
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'cat' },
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'dog' },
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'robot' },
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'monster' },
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'alien' },
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'superhero' },
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'wizard' },
  { src: 'https://placehold.co/600x400.png', alt: 'A placeholder couch image', hint: 'dragon' },
];


export default function Home() {
  const [recentImages, setRecentImages] = useState<CouchImage[]>(initialImages);

  const handleGenerationComplete = (newImageSrc: string) => {
    const newImage: CouchImage = {
      src: newImageSrc,
      alt: 'A new AI-generated couch image',
      hint: 'couch creation'
    };
    setRecentImages(prev => [newImage, ...prev].slice(0, 10));
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section id="home" className="relative w-full py-24 md:py-32 lg:py-40 text-center overflow-hidden">
           <div className="absolute inset-0 bg-primary/10 -z-10"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10"></div>
           <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl -z-10"></div>
           <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Put your vibes on the Couch <span className="inline-block animate-wave">🛋️</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80">
                Powered by AI &amp; <span className="font-bold text-primary">$COUCH</span>
              </p>
              
              <ImageUploader onGenerationComplete={handleGenerationComplete} />
              <p className="text-muted-foreground text-sm">
                Upload any image. We'll generate a version of it sitting comfortably on a couch.
              </p>
            </div>
          </div>
        </section>

        <RecentGallery images={recentImages} />

        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What is $COUCH?</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  $COUCH is more than just a meme coin; it's a community-driven project that brings fun and creativity to the crypto space. Our goal is to build a vibrant ecosystem powered by AI and Web3 technologies, where everyone can relax, create, and share.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      Buy $COUCH on Solana DEX
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                   <Button size="lg" variant="secondary" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      Learn More
                    </a>
                  </Button>
                </div>
              </div>
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Tokenomics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Supply:</span>
                      <span className="font-mono font-medium">1,000,000,000 $COUCH</span>
                    </div>
                     <div className="flex justify-between">
                      <span>Utility:</span>
                      <span className="font-medium">Powering AI tools, community voting</span>
                    </div>
                     <div className="flex justify-between">
                      <span>Tax:</span>
                      <span className="font-mono font-medium">0/0</span>
                    </div>
                     <div className="flex justify-between">
                      <span>Liquidity:</span>
                      <span className="font-medium">Burnt Forever</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
