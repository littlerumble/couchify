import { promises as fs } from 'fs';
import path from 'path';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ImageEditor } from '@/components/image-editor';

async function getBase64Image() {
  const imagePath = path.join(process.cwd(), 'src', 'ai', '5989857315257436567.jpg');
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error("Failed to read base image:", error);
    // Fallback to a placeholder if the image can't be read
    return 'https://placehold.co/1280x720.png';
  }
}

export default async function Home() {
  const baseImageSrc = await getBase64Image();

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section id="home" className="relative w-full py-24 md:py-32 text-center overflow-hidden">
           <div className="absolute inset-0 bg-primary/10 -z-10"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10"></div>
           <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl -z-10"></div>
           <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Create Your Couch Scene
              </h1>
               <p className="text-muted-foreground md:text-xl">
                Upload an image, drag it into position, and save your masterpiece.
              </p>
              
              <ImageEditor baseImageSrc={baseImageSrc} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
