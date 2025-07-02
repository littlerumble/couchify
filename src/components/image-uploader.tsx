'use client';

import { useState, useRef, type DragEvent } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Loader2, Share2, CornerDownRight } from 'lucide-react';
import { couchImageGeneration } from '@/ai/flows/couch-image-generation';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onGenerationComplete: (imageSrc: string) => void;
}

export function ImageUploader({ onGenerationComplete }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUploadedImage(base64String);
        generateCouchImage(base64String);
      };
      reader.readAsDataURL(file);
    } else {
        toast({
            title: 'Invalid File',
            description: 'Please upload a valid image file.',
            variant: 'destructive',
        });
    }
  };

  const generateCouchImage = async (photoDataUri: string) => {
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const result = await couchImageGeneration({ photoDataUri });
      if (result.generatedCouchImage) {
        setGeneratedImage(result.generatedCouchImage);
        onGenerationComplete(result.generatedCouchImage);
      } else {
        throw new Error('AI failed to generate an image.');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Generation Failed',
        description: 'Something went wrong while creating your couch vibe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLFormElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };
  
  const resetState = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto bg-background/80 backdrop-blur-sm">
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[250px]">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <p className="text-lg font-semibold text-foreground">Warming up the couch...</p>
        </CardContent>
      </Card>
    );
  }

  if (generatedImage && uploadedImage) {
    return (
      <Card className="w-full max-w-xl mx-auto overflow-hidden">
        <CardHeader className="p-4 bg-secondary/50">
            <h3 className="font-headline text-lg text-center font-semibold">Your Couch Creation</h3>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-center">
            <Image src={uploadedImage} alt="Uploaded image" width={400} height={400} className="rounded-lg aspect-square object-cover" />
            <div className="hidden md:flex justify-center">
                <CornerDownRight className="h-12 w-12 text-primary/50" />
            </div>
            <Image src={generatedImage} alt="Generated couch image" width={400} height={400} className="rounded-lg aspect-square object-cover" data-ai-hint="couch creation" />
          </div>
          <div className="mt-4 text-center space-y-4">
             <p className="text-muted-foreground font-medium">Share this with your friends 🔥 #CouchVibes</p>
             <div className="flex justify-center gap-2">
                <Button size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
                <Button size="sm" variant="outline" onClick={resetState}>
                    Create Another
                </Button>
             </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
        <form onSubmit={(e) => e.preventDefault()} onDragEnter={handleDrag} className="relative">
            <CardContent className="p-6" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <div className={cn("border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-300", dragActive ? "border-primary bg-primary/10" : "bg-secondary/30")}>
                    <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                    <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={handleInputChange} />
                    <p className="text-muted-foreground mb-2">Drag & Drop your image here</p>
                    <p className="text-muted-foreground text-sm mb-4">or</p>
                    <Button type="button" onClick={onButtonClick}>Upload Image</Button>
                </div>
            </CardContent>
        </form>
    </Card>
  );
}
