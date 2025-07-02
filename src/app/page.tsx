'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ImageUploader } from '@/components/image-uploader';
import { RecentGallery } from '@/components/recent-gallery';

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
                Upload image to couchify
              </h1>
              
              <ImageUploader onGenerationComplete={handleGenerationComplete} />
            </div>
          </div>
        </section>

        <RecentGallery images={recentImages} />
        
      </main>
      <Footer />
    </div>
  );
}
