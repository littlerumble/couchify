'use client';

import { useState, useRef, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Download, RefreshCw, ZoomIn, RotateCw, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { imageMagic } from '@/ai/flows/remove-background-flow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { saveCreationToServer } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface ImageEditorProps {
  baseImageSrc: string;
}

export function ImageEditor({ baseImageSrc }: ImageEditorProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 150, height: 150 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prompt, setPrompt] = useState('');

  const { toast } = useToast();
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setUploadedImage(null);
    setOriginalImage(null);
    setGeneratedImage(null);
    setScale(1);
    setRotation(0);
    setPosition({ x: 50, y: 50 });
    setPrompt('');
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        handleReset();
        setOriginalImage(result);
        setUploadedImage(result);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !canvasRef.current || generatedImage) return;
    const target = e.target as HTMLElement;
    if (!target.closest('.draggable-wrapper')) return;

    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const clickXInCanvas = e.clientX - canvasRect.left;
    const clickYInCanvas = e.clientY - canvasRect.top;
    
    setDragStartOffset({
      x: clickXInCanvas - position.x,
      y: clickYInCanvas - position.y,
    });
  };

  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const renderedWidth = imageSize.width * scale;
    const renderedHeight = imageSize.height * scale;
    
    let newX = e.clientX - canvasRect.left - dragStartOffset.x;
    let newY = e.clientY - canvasRect.top - dragStartOffset.y;
    
    newX = Math.max(0, Math.min(newX, canvasRect.width - renderedWidth));
    newY = Math.max(0, Math.min(newY, canvasRect.height - renderedHeight));

    setPosition({ x: newX, y: newY });
  };

  const onMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const saveImage = async () => {
    if (!canvasRef.current) return;
    
    setIsSaving(true);
    const controls = document.getElementById('image-controls');
    if (controls) controls.style.visibility = 'hidden';

    try {
      const canvas = await html2canvas(canvasRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
      });
      const imageUri = canvas.toDataURL('image/png', 1.0);
      
      // Save to server
      const result = await saveCreationToServer(imageUri);
      if (!result.success) {
          throw new Error(result.error || 'Server-side save failed');
      }

      // Trigger client-side download
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = 'couch-creation.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh page data for carousel
      router.refresh();

    } catch (error) {
        console.error("Error saving image:", error);
        toast({
            title: 'Error',
            description: 'Could not save the image. Please try again.',
            variant: 'destructive'
        });
    } finally {
        if (controls) controls.style.visibility = 'visible';
        setIsSaving(false);
    }
  };

  const handleMagic = async () => {
    if (!canvasRef.current || !prompt) return;

    setIsGenerating(true);
    try {
        const canvas = await html2canvas(canvasRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
        });
        const compositeImageUri = canvas.toDataURL('image/png');
        
        const result = await imageMagic({ photoDataUri: compositeImageUri, prompt });

        setGeneratedImage(result.generatedImage);
        setUploadedImage(null);

    } catch (error) {
        console.error("Error with AI Magic:", error);
        toast({
          title: "AI Magic Failed",
          description: "The AI was unable to process your request. This could be due to safety restrictions or an issue with the prompt. Please try a different image or prompt.",
          variant: "destructive",
        });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-6">
            {!originalImage ? (
                <div 
                    onDrop={handleDrop} 
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-secondary/30 h-[250px] sm:h-[400px]"
                >
                    <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleInputChange} />
                    <p className="text-muted-foreground mb-2">Drag & Drop your image here</p>
                    <p className="text-muted-foreground text-sm mb-4">or</p>
                    <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload Image</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div 
                        ref={canvasRef}
                        className="relative w-full aspect-video bg-cover bg-center bg-no-repeat overflow-hidden rounded-lg"
                        style={{ backgroundImage: `url(${generatedImage || baseImageSrc})` }}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUpOrLeave}
                        onMouseLeave={onMouseUpOrLeave}
                        onMouseDown={onMouseDown}
                    >
                        {uploadedImage && !generatedImage && (
                            <div
                                className="absolute cursor-move select-none draggable-wrapper"
                                style={{ 
                                  top: `${position.y}px`, 
                                  left: `${position.x}px`,
                                  width: `${imageSize.width * scale}px`,
                                  height: `${imageSize.height * scale}px`,
                                  transform: `rotate(${rotation}deg)`,
                                }}
                            >
                                <Image
                                    ref={imageRef}
                                    src={uploadedImage}
                                    alt="Draggable subject"
                                    fill
                                    onDragStart={(e) => e.preventDefault()}
                                    className="pointer-events-none"
                                    onLoadingComplete={(img) => {
                                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                                        const newWidth = 150;
                                        setImageSize({ width: newWidth, height: newWidth / aspectRatio });
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <div id="image-controls" className="flex flex-col items-center gap-6 pt-4">
                         {!generatedImage && (
                           <div className="w-full sm:w-[80%] flex flex-col items-center gap-4">
                              <div className="w-full sm:w-64 flex flex-col gap-4">
                                  <div className="grid w-full items-center gap-2">
                                      <Label htmlFor="size-slider" className="flex items-center gap-2"><ZoomIn className="h-4 w-4" /> Size</Label>
                                      <Slider
                                          id="size-slider"
                                          value={[scale]}
                                          min={0.1}
                                          max={3}
                                          step={0.05}
                                          onValueChange={(value) => setScale(value[0])}
                                          disabled={isGenerating || isSaving}
                                      />
                                  </div>
                                  <div className="grid w-full items-center gap-2">
                                      <Label htmlFor="tilt-slider" className="flex items-center gap-2"><RotateCw className="h-4 w-4" /> Tilt</Label>
                                      <Slider
                                          id="tilt-slider"
                                          value={[rotation]}
                                          min={-180}
                                          max={180}
                                          step={1}
                                          onValueChange={(value) => setRotation(value[0])}
                                          disabled={isGenerating || isSaving}
                                      />
                                  </div>
                              </div>
                           </div>
                         )}
                         <div className="flex flex-wrap justify-center gap-2">
                            {!generatedImage && (
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" disabled={isGenerating || isSaving}>
                                        <WandSparkles className="mr-2 h-4 w-4" />
                                        AI Edit
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <form onSubmit={(e) => { e.preventDefault(); handleMagic(); }}>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">AI Magic</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Describe the change you want the AI to make.
                                                </p>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="prompt-input">Your Prompt</Label>
                                                <Textarea
                                                    id="prompt-input"
                                                    placeholder="e.g. 'turn the scene into a comic book style'"
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    onKeyDown={(e) => {
                                                       if (e.key === 'Enter' && !e.shiftKey) {
                                                           e.preventDefault();
                                                           handleMagic();
                                                       }
                                                    }}
                                                />
                                            </div>
                                            <Button type="submit" disabled={isGenerating || !prompt}>
                                                {isGenerating ? (
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                   <WandSparkles className="mr-2 h-4 w-4" />
                                                )}
                                                Generate
                                            </Button>
                                        </div>
                                    </form>
                                </PopoverContent>
                            </Popover>
                            )}
                            <Button onClick={saveImage} disabled={isGenerating || isSaving}>
                                {isSaving ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Save
                            </Button>
                            <Button variant="outline" onClick={handleReset} disabled={isGenerating || isSaving}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Start Over
                            </Button>
                         </div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
