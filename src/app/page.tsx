import { promises as fs } from 'fs';
import path from 'path';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ImageEditor } from '@/components/image-editor';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getBackgroundImages() {
  const couchImagesPath = '/home/user/studio/couch_images';
  const defaultImage = 'https://placehold.co/1280x720.png';

  try {
    await fs.mkdir(couchImagesPath, { recursive: true });
    
    const imageFiles = await fs.readdir(couchImagesPath);
    
    const imageFilesSorted = imageFiles
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .sort((a, b) => {
        if (a === 'couch-1.jpg') return -1;
        if (b === 'couch-1.jpg') return 1;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });

    if (imageFilesSorted.length === 0) {
      throw new Error('No background images found in couch_images directory.');
    }
    
    const backgroundUris = await Promise.all(
      imageFilesSorted.map(async (file) => {
        const imagePath = path.join(couchImagesPath, file);
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${base64Image}`;
      })
    );

    return backgroundUris;

  } catch (error) {
    console.error("Failed to read background images, falling back to default:", error);
    // Fallback to the original couch image if the directory is missing or empty
    const defaultCouchPath = path.join(process.cwd(), 'src', 'ai', '5989857315257436567.jpg');
    try {
      const imageBuffer = await fs.readFile(defaultCouchPath);
      const base64Image = imageBuffer.toString('base64');
      return [`data:image/jpeg;base64,${base64Image}`];
    } catch (readError) {
      console.error("Failed to read fallback base image:", readError);
      return [defaultImage];
    }
  }
}

async function getRecentCreations() {
  const genImagePath = '/home/user/studio/gen_images';
  const defaultCreations = [
    { src: 'https://placehold.co/600x400.png', hint: 'couch meme' },
    { src: 'https://placehold.co/600x400.png', hint: 'funny edit' },
    { src: 'https://placehold.co/600x400.png', hint: 'surreal art' },
    { src: 'https://placehold.co/600x400.png', hint: 'photo collage' },
    { src: 'https://placehold.co/600x400.png', hint: 'abstract scene' },
  ];

  try {
    await fs.mkdir(genImagePath, { recursive: true });
    
    const imageFiles = await fs.readdir(genImagePath);

    const sortedFiles = (await Promise.all(
      imageFiles.map(async (file) => ({
        file,
        stats: await fs.stat(path.join(genImagePath, file)),
      }))
    ))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
      .map((item) => item.file);
      
    const creations = await Promise.all(
      sortedFiles.slice(0, 5).map(async (file) => {
        const imagePath = path.join(genImagePath, file);
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return {
          src: `data:${mimeType};base64,${base64Image}`,
          hint: 'user creation'
        };
      })
    );
    
    if (creations.length > 0) {
        return creations;
    }
    return defaultCreations;

  } catch (error) {
    console.error("Failed to read recent creations:", error);
    return defaultCreations;
  }
}

export default async function Home() {
  const backgroundImages = await getBackgroundImages();
  const recentCreations = await getRecentCreations();

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section id="home" className="relative w-full py-12 md:py-24 text-center overflow-hidden">
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
              
              <ImageEditor backgroundImages={backgroundImages} />
            </div>
          </div>
        </section>

        <section id="creations" className="w-full pb-12 md:pb-24">
            <div className="container px-4 md:px-6">
                <div className="max-w-5xl mx-auto space-y-6 text-center">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                        Recent Creations
                    </h2>
                    <p className="text-muted-foreground md:text-lg">
                        See what the community has been creating on the couch.
                    </p>
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {recentCreations.map((creation, index) => (
                                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                        <Card>
                                            <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                                                <Image 
                                                    src={creation.src} 
                                                    alt={`Creation ${index + 1}`} 
                                                    width={600} 
                                                    height={400}
                                                    className="w-full h-full object-cover"
                                                    data-ai-hint={creation.hint}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
