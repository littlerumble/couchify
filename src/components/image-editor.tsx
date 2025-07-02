'use client';

import { useState, useRef, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ImageEditorProps {
  baseImageSrc: string;
}

export function ImageEditor({ baseImageSrc }: ImageEditorProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 150, height: 150 });

  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        // Reset position for new image
        setPosition({ x: 50, y: 50 });
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

  const onMouseDown = (e: ReactMouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    const imageRect = imageRef.current.getBoundingClientRect();
    setDragStartOffset({
      x: e.clientX - imageRect.left,
      y: e.clientY - imageRect.top,
    });
  };

  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    let newX = e.clientX - canvasRect.left - dragStartOffset.x;
    let newY = e.clientY - canvasRect.top - dragStartOffset.y;
    
    newX = Math.max(0, Math.min(newX, canvasRect.width - imageSize.width));
    newY = Math.max(0, Math.min(newY, canvasRect.height - imageSize.height));

    setPosition({ x: newX, y: newY });
  };

  const onMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const saveImage = async () => {
    if (!canvasRef.current) return;
    // Hide buttons during capture
    const saveButton = document.getElementById('save-button');
    const newButton = document.getElementById('new-button');
    if(saveButton) saveButton.style.display = 'none';
    if(newButton) newButton.style.display = 'none';

    try {
      const canvas = await html2canvas(canvasRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null, // Make background transparent if needed
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = 'couch-creation.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
        console.error("Error saving image:", error);
        toast({
            title: 'Error',
            description: 'Could not save the image. Please try again.',
            variant: 'destructive'
        });
    } finally {
        // Show buttons again
        if(saveButton) saveButton.style.display = 'inline-flex';
        if(newButton) newButton.style.display = 'inline-flex';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-6">
            {!uploadedImage ? (
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
                        style={{ backgroundImage: `url(${baseImageSrc})` }}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUpOrLeave}
                        onMouseLeave={onMouseUpOrLeave}
                    >
                        {uploadedImage && (
                            <Image
                                ref={imageRef}
                                src={uploadedImage}
                                alt="Draggable subject"
                                width={0}
                                height={0}
                                onMouseDown={onMouseDown}
                                onDragStart={(e) => e.preventDefault()}
                                className="absolute cursor-move select-none"
                                style={{ 
                                  top: `${position.y}px`, 
                                  left: `${position.x}px`,
                                  width: `${imageSize.width}px`,
                                  height: `${imageSize.height}px`,
                                }}
                                onLoadingComplete={(img) => {
                                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                                    const newWidth = 150;
                                    setImageSize({ width: newWidth, height: newWidth / aspectRatio });
                                }}
                            />
                        )}
                    </div>
                    <div className="flex justify-center gap-4">
                        <Button id="save-button" onClick={saveImage}>
                            <Download className="mr-2 h-4 w-4" />
                            Save Composition
                        </Button>
                        <Button id="new-button" variant="outline" onClick={() => setUploadedImage(null)}>
                            Upload New Image
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
