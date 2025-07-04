'use client';

import { useState, useRef, type DragEvent, type MouseEvent as ReactMouseEvent, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Download, RefreshCw, ZoomIn, RotateCw, WandSparkles, ChevronLeft, ChevronRight, Text, Smile, Move, X, ImageOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { imageMagic } from '@/ai/flows/remove-background-flow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { saveCreationToServer, removeBackground } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BlingIcon, CigarIcon, CrownIcon, DealWithItGlassesIcon, MustacheIcon, TopHatIcon } from '@/components/icons';
import { cn } from '@/lib/utils';


interface Layer {
    id: string;
    type: 'image' | 'text' | 'sticker';
    content: any;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    width: number;
    height: number;
}

interface ImageEditorProps {
  backgroundImages: string[];
}

export function ImageEditor({ backgroundImages }: ImageEditorProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [editorStarted, setEditorStarted] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLayer = useMemo(() => {
    return layers.find(l => l.id === activeLayerId);
  }, [layers, activeLayerId]);

  useEffect(() => {
    // Reset layers if background changes, but not on initial load
    handleReset(true);
  }, [currentBgIndex]);

  const updateLayer = (id: string, newProps: Partial<Layer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...newProps } : l)));
  };

  const addLayer = (type: 'text' | 'sticker', content: any, dimensions: { width: number; height: number; }) => {
    const newLayer: Layer = {
      id: uuidv4(),
      type,
      content,
      position: { x: 50, y: 50 },
      scale: 1,
      rotation: 0,
      width: dimensions.width,
      height: dimensions.height,
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const deleteActiveLayer = () => {
    if (!activeLayerId) return;
    setLayers(prev => prev.filter(l => l.id !== activeLayerId));
    setActiveLayerId(null);
  };

  const handleReset = (soft = false) => {
    if (!soft) {
        setCurrentBgIndex(0);
        setEditorStarted(false);
    }
    setLayers([]);
    setActiveLayerId(null);
    setGeneratedImage(null);
    setPrompt('');
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const img = document.createElement('img');
        img.src = result;
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const newWidth = 150;
          const newHeight = newWidth / aspectRatio;
          
          const newLayer: Layer = {
            id: uuidv4(),
            type: 'image',
            content: result,
            position: { x: 50, y: 50 },
            scale: 1,
            rotation: 0,
            width: newWidth,
            height: newHeight,
          };
          setLayers(prev => [...prev, newLayer]);
          setActiveLayerId(newLayer.id);
          setEditorStarted(true);
        }
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
      e.target.value = '';
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

  const onLayerMouseDown = (e: ReactMouseEvent<HTMLDivElement>, layerId: string) => {
    e.stopPropagation();
    
    if (generatedImage) return;

    setActiveLayerId(layerId);
    setIsInteracting(true);
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clickXInCanvas = e.clientX - canvasRect.left;
    const clickYInCanvas = e.clientY - canvasRect.top;
    
    setDragStartOffset({
      x: clickXInCanvas - layer.position.x,
      y: clickYInCanvas - layer.position.y,
    });
  };

  const onCanvasMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('.layer-wrapper')) return;
      setActiveLayerId(null);
  }

  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isInteracting || !activeLayer || !canvasRef.current) return;
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const renderedWidth = activeLayer.width * activeLayer.scale;
    const renderedHeight = activeLayer.height * activeLayer.scale;
    
    let newX = e.clientX - canvasRect.left - dragStartOffset.x;
    let newY = e.clientY - canvasRect.top - dragStartOffset.y;
    
    newX = Math.max(0, Math.min(newX, canvasRect.width - renderedWidth));
    newY = Math.max(0, Math.min(newY, canvasRect.height - renderedHeight));

    updateLayer(activeLayer.id, { position: { x: newX, y: newY } });
  };

  const onMouseUpOrLeave = () => {
    setIsInteracting(false);
  };

  const saveImage = async () => {
    if (!canvasRef.current) return;
    
    setActiveLayerId(null);
    setIsSaving(true);
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow state to update

    try {
      const canvas = await html2canvas(canvasRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
      });
      const imageUri = canvas.toDataURL('image/png', 1.0);
      
      const result = await saveCreationToServer(imageUri);
      if (!result.success) {
          throw new Error(result.error || 'Server-side save failed');
      }

      const link = document.createElement('a');
      link.href = imageUri;
      link.download = 'couch-creation.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      router.refresh();

    } catch (error) {
        console.error("Error saving image:", error);
        toast({
            title: 'Error',
            description: 'Could not save the image. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleMagic = async () => {
    if (!canvasRef.current || !prompt) return;

    setActiveLayerId(null);
    setIsGenerating(true);

    await new Promise(resolve => setTimeout(resolve, 100)); // Allow state to update

    try {
        const canvas = await html2canvas(canvasRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
        });
        const compositeImageUri = canvas.toDataURL('image/png');
        
        const result = await imageMagic({ photoDataUri: compositeImageUri, prompt });

        setGeneratedImage(result.generatedImage);
        setLayers([]);

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
  
  const handleRemoveBackground = async () => {
    if (!activeLayer || activeLayer.type !== 'image') return;

    setIsRemovingBg(true);
    try {
        const result = await removeBackground(activeLayer.content);
        if (result.success && result.image) {
            updateLayer(activeLayer.id, { content: result.image });
            toast({
                title: 'Success',
                description: 'Background removed.',
            });
        } else {
            throw new Error(result.error || 'Failed to remove background.');
        }
    } catch (error: any) {
        toast({
            title: 'Background Removal Failed',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsRemovingBg(false);
    }
  };

  const handlePrevBg = () => {
    setCurrentBgIndex((prevIndex) =>
      prevIndex === 0 ? backgroundImages.length - 1 : prevIndex - 1
    );
  };

  const handleNextBg = () => {
    setCurrentBgIndex((prevIndex) =>
      prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const stickers = [
    { name: 'Glasses', component: DealWithItGlassesIcon, width: 80, height: 30 },
    { name: 'Top Hat', component: TopHatIcon, width: 80, height: 70 },
    { name: 'Mustache', component: MustacheIcon, width: 80, height: 24 },
    { name: 'Cigar', component: CigarIcon, width: 60, height: 18 },
    { name: 'Bling', component: BlingIcon, width: 60, height: 60 },
    { name: 'Crown', component: CrownIcon, width: 70, height: 50 },
  ];
  
  if (!editorStarted) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleInputChange} multiple={false} />
          <div 
            className="relative w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground cursor-pointer hover:border-primary hover:bg-accent transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <UploadCloud className="h-12 w-12 mb-4" />
            <p className="font-semibold text-lg">Drag & Drop an image here</p>
            <p className="text-sm">or click to upload a file</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-6">
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleInputChange} multiple={false} />
            <div className="space-y-4">
                <div 
                    ref={canvasRef}
                    className="relative w-full aspect-video bg-cover bg-center bg-no-repeat overflow-hidden rounded-lg group/canvas"
                    style={{ backgroundImage: `url(${generatedImage || backgroundImages[currentBgIndex]})` }}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUpOrLeave}
                    onMouseLeave={onMouseUpOrLeave}
                    onMouseDown={onCanvasMouseDown}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {backgroundImages.length > 1 && !generatedImage && (
                        <>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/canvas:opacity-100 transition-opacity"
                                onClick={handlePrevBg}
                                disabled={isGenerating || isSaving}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/canvas:opacity-100 transition-opacity"
                                onClick={handleNextBg}
                                disabled={isGenerating || isSaving}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {!generatedImage && layers.map((layer, index) => (
                         <div
                            key={layer.id}
                            className={cn(
                                'absolute select-none layer-wrapper',
                                {'cursor-move': isInteracting && activeLayerId === layer.id},
                                {'ring-2 ring-primary ring-offset-2 ring-offset-background': activeLayerId === layer.id},
                            )}
                            style={{ 
                              top: `${layer.position.y}px`, 
                              left: `${layer.position.x}px`,
                              width: `${layer.width * layer.scale}px`,
                              height: `${layer.height * layer.scale}px`,
                              transform: `rotate(${layer.rotation}deg)`,
                              zIndex: index + 1
                            }}
                            onMouseDown={(e) => onLayerMouseDown(e, layer.id)}
                        >
                            {activeLayerId === layer.id && !generatedImage && (
                              <>
                                <div
                                  title="Move"
                                  className="absolute -top-3 -left-3 bg-primary text-primary-foreground rounded-full p-0.5 cursor-move z-20"
                                >
                                  <Move className="w-3 h-3" />
                                </div>
                                <div
                                  title="Delete"
                                  className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-0.5 cursor-pointer hover:scale-110 transition-transform z-20"
                                  onMouseDown={(e) => { e.stopPropagation(); deleteActiveLayer(); }}
                                >
                                  <X className="w-3 h-3" />
                                </div>
                              </>
                            )}
                            {layer.type === 'image' && (
                                <Image
                                    src={layer.content}
                                    alt="User upload"
                                    fill
                                    draggable={false}
                                    className="pointer-events-none"
                                />
                            )}
                            {layer.type === 'text' && (
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => updateLayer(layer.id, { content: e.currentTarget.textContent || '' })}
                                    className="w-full h-full pointer-events-auto bg-transparent focus:outline-none text-3xl font-bold text-white cursor-text"
                                    style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}
                                >
                                    {layer.content}
                                </div>
                            )}
                            {layer.type === 'sticker' && (
                                 <layer.content className="w-full h-full pointer-events-none" />
                            )}
                        </div>
                    ))}
                </div>
                <div id="image-controls" className="flex flex-col items-center gap-6 pt-4">
                     {activeLayer && !generatedImage && (
                       <div className="w-full sm:w-[80%] flex flex-col items-center gap-4">
                          <div className="w-full sm:w-64 flex flex-col gap-4">
                              <div className="grid w-full items-center gap-2">
                                  <Label htmlFor="size-slider" className="flex items-center gap-2"><ZoomIn className="h-4 w-4" /> Size</Label>
                                  <Slider
                                      id="size-slider"
                                      value={[activeLayer.scale]}
                                      min={0.1}
                                      max={5}
                                      step={0.05}
                                      onValueChange={(value) => updateLayer(activeLayer.id, { scale: value[0] })}
                                      disabled={isGenerating || isSaving}
                                  />
                              </div>
                              <div className="grid w-full items-center gap-2">
                                  <Label htmlFor="tilt-slider" className="flex items-center gap-2"><RotateCw className="h-4 w-4" /> Tilt</Label>
                                  <Slider
                                      id="tilt-slider"
                                      value={[activeLayer.rotation]}
                                      min={-180}
                                      max={180}
                                      step={1}
                                      onValueChange={(value) => updateLayer(activeLayer.id, { rotation: value[0] })}
                                      disabled={isGenerating || isSaving}
                                  />
                              </div>
                          </div>
                       </div>
                     )}
                     <div className="flex flex-wrap justify-center gap-2">
                        {!generatedImage && (
                            <>
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isGenerating || isSaving}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Add Image
                            </Button>
                            <Button variant="outline" onClick={() => addLayer('text', 'Edit Me', { width: 150, height: 40 })} disabled={isGenerating || isSaving}>
                                <Text className="mr-2 h-4 w-4" />
                                Add Text
                            </Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" disabled={isGenerating || isSaving}>
                                        <Smile className="mr-2 h-4 w-4" />
                                        Add Sticker
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48">
                                    <div className="grid grid-cols-3 gap-2">
                                        {stickers.map(sticker => (
                                            <Button key={sticker.name} variant="ghost" className="h-auto p-2 flex flex-col gap-1" onClick={() => addLayer('sticker', sticker.component, { width: sticker.width, height: sticker.height })}>
                                                <sticker.component className="w-10 h-10" />
                                                <span className="text-xs">{sticker.name}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                             {activeLayer && activeLayer.type === 'image' && !generatedImage && (
                                <Button variant="outline" onClick={handleRemoveBackground} disabled={isRemovingBg || isGenerating || isSaving}>
                                    {isRemovingBg ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ImageOff className="mr-2 h-4 w-4" />
                                    )}
                                    Remove BG
                                </Button>
                            )}
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
                            </>
                        )}
                     </div>
                     <div className="flex flex-wrap justify-center gap-2 pt-4 border-t w-full">
                        <Button onClick={saveImage} disabled={isGenerating || isSaving || layers.length === 0 && !generatedImage}>
                            {isSaving ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Save
                        </Button>
                        <Button variant="outline" onClick={() => handleReset(false)} disabled={isGenerating || isSaving}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Start Over
                        </Button>
                     </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
