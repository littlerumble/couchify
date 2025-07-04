
'use client';

import { useState, useRef, type DragEvent, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Download, RefreshCw, ZoomIn, RotateCw, ChevronLeft, ChevronRight, Text, Smile, Move, X, ImageOff, Palette, Type, Pen, Paintbrush } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { saveCreationToServer } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BlingIcon, CigarIcon, CrownIcon, DealWithItGlassesIcon, MustacheIcon, TopHatIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface Layer {
    id: string;
    type: 'image' | 'text' | 'sticker';
    content: any;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    width: number;
    height: number;
    color?: string;
    fontFamily?: string;
}

interface ImageEditorProps {
  backgroundImages: string[];
}

type Point = { clientX: number; clientY: number };

export function ImageEditor({ backgroundImages }: ImageEditorProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  
  const [tool, setTool] = useState<'move' | 'pen' | 'brush'>('move');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  
  const [replacingBgLayerId, setReplacingBgLayerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [editorStarted, setEditorStarted] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLayer = useMemo(() => {
    return layers.find(l => l.id === activeLayerId);
  }, [layers, activeLayerId]);
  
  useEffect(() => {
    handleReset(true);
  }, [currentBgIndex]);
  
  useEffect(() => {
      const canvas = drawingCanvasRef.current;
      const container = canvasRef.current;
      if (canvas && container) {
          canvas.width = container.offsetWidth;
          canvas.height = container.offsetHeight;
      }
  }, [editorStarted]);
  
  useEffect(() => {
    if (tool !== 'move') {
      setActiveLayerId(null);
    }
  }, [tool]);

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
      ...(type === 'text' && { color: '#FFFFFF', fontFamily: 'Impact' })
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    setTool('move');
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

    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if(canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const img = document.createElement('img');
        img.src = result;
        img.onload = () => {
          if (replacingBgLayerId) {
            updateLayer(replacingBgLayerId, { content: result });
            setReplacingBgLayerId(null);
            toast({
              title: 'Image Replaced',
              description: 'Your image has been updated with the new version.',
            });
          } else {
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
            setTool('move');
            if (!editorStarted) {
                setEditorStarted(true);
            }
          }
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

  const handleLayerInteractionStart = (point: Point, layerId: string) => {
    setActiveLayerId(layerId);
    setIsInteracting(true);
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clickXInCanvas = point.clientX - canvasRect.left;
    const clickYInCanvas = point.clientY - canvasRect.top;
    
    setDragStartOffset({
      x: clickXInCanvas - layer.position.x,
      y: clickYInCanvas - layer.position.y,
    });
  };

  const onLayerMouseDown = (e: ReactMouseEvent<HTMLDivElement>, layerId: string) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    handleLayerInteractionStart(e, layerId);
  };

  const onLayerTouchStart = (e: ReactTouchEvent<HTMLDivElement>, layerId: string) => {
    if (tool !== 'move' || e.touches.length === 0) return;
    e.stopPropagation();
    handleLayerInteractionStart(e.touches[0], layerId);
  };

  const startDrawing = (point: Point) => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = tool === 'brush' ? brushSize * 1.5 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const onCanvasMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (tool === 'move') {
      if ((e.target as HTMLElement).closest('.layer-wrapper')) return;
      setActiveLayerId(null);
    } else {
      startDrawing(e);
    }
  }

  const onCanvasTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    if (tool === 'move') {
      if ((e.target as HTMLElement).closest('.layer-wrapper')) return;
      setActiveLayerId(null);
    } else {
      e.preventDefault();
      startDrawing(e.touches[0]);
    }
  }

  const draw = (point: Point) => {
    if (!isDrawing) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
  };

  const handleMove = (point: Point) => {
    if (tool === 'move') {
        if (!isInteracting || !activeLayer || !canvasRef.current) return;
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        const renderedWidth = activeLayer.width * activeLayer.scale;
        const renderedHeight = activeLayer.height * activeLayer.scale;
        
        let newX = point.clientX - canvasRect.left - dragStartOffset.x;
        let newY = point.clientY - canvasRect.top - dragStartOffset.y;
        
        newX = Math.max(0, Math.min(newX, canvasRect.width - renderedWidth));
        newY = Math.max(0, Math.min(newY, canvasRect.height - renderedHeight));

        updateLayer(activeLayer.id, { position: { x: newX, y: newY } });
    } else {
      draw(point);
    }
  }

  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    handleMove(e);
  };

  const onTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0]);
    }
  };

  const onMouseUpOrLeave = () => {
    if (tool === 'move') {
      setIsInteracting(false);
    } else {
      stopDrawing();
    }
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
  
  const handleRemoveBackground = async () => {
    if (!activeLayer || activeLayer.type !== 'image') return;
    
    setReplacingBgLayerId(activeLayer.id);
    window.open('https://www.remove.bg/upload', '_blank');
    
    toast({
        title: 'Ready for your new image?',
        description: "Once you've downloaded from remove.bg, just drag the new file onto the canvas to replace the old one.",
        duration: 9000,
    });
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
        <CardContent className="p-2 sm:p-6">
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
        <CardContent className="p-2 sm:p-6">
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleInputChange} multiple={false} />
            <div className="space-y-4">
                <div 
                    ref={canvasRef}
                    className="relative w-full aspect-video bg-cover bg-center bg-no-repeat overflow-hidden rounded-lg group/canvas"
                    style={{ backgroundImage: `url(${backgroundImages[currentBgIndex]})` }}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUpOrLeave}
                    onMouseLeave={onMouseUpOrLeave}
                    onMouseDown={onCanvasMouseDown}
                    onTouchStart={onCanvasTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onMouseUpOrLeave}
                    onTouchCancel={onMouseUpOrLeave}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <canvas
                        ref={drawingCanvasRef}
                        className={cn(
                            'absolute top-0 left-0',
                            tool !== 'move' ? 'cursor-crosshair z-20' : 'pointer-events-none z-0'
                        )}
                    />
                    {backgroundImages.length > 1 && (
                        <>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className={cn(
                                    "absolute left-2 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/canvas:opacity-100 transition-opacity",
                                    isSaving && "hidden"
                                )}
                                onClick={handlePrevBg}
                                disabled={isSaving}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/canvas:opacity-100 transition-opacity",
                                    isSaving && "hidden"
                                )}
                                onClick={handleNextBg}
                                disabled={isSaving}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {layers.map((layer, index) => (
                         <div
                            key={layer.id}
                            className={cn(
                                'absolute select-none layer-wrapper',
                                {'cursor-move': isInteracting && activeLayerId === layer.id && tool === 'move'},
                                {'ring-2 ring-primary ring-offset-2 ring-offset-background': activeLayerId === layer.id && tool === 'move'},
                                {'ring-blue-500': replacingBgLayerId === layer.id},
                                tool !== 'move' && 'pointer-events-none'
                            )}
                            style={{ 
                              top: `${layer.position.y}px`, 
                              left: `${layer.position.x}px`,
                              width: `${layer.width}px`,
                              height: `${layer.height}px`,
                              transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                              transformOrigin: 'center center',
                              zIndex: index + 1
                            }}
                            onMouseDown={(e) => onLayerMouseDown(e, layer.id)}
                            onTouchStart={(e) => onLayerTouchStart(e, layer.id)}
                        >
                            {activeLayerId === layer.id && tool === 'move' && (
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
                                    className="pointer-events-none object-contain"
                                />
                            )}
                            {layer.type === 'text' && (
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => updateLayer(layer.id, { content: e.currentTarget.textContent || '' })}
                                    className="w-full h-full pointer-events-auto bg-transparent focus:outline-none text-3xl font-bold cursor-text flex items-center justify-center text-center"
                                    style={{
                                        color: layer.color,
                                        fontFamily: layer.fontFamily,
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                                        fontSize: '2rem' // Scale will handle the sizing
                                    }}
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
                     <div className="flex flex-wrap justify-center gap-2">
                        <Button variant={tool === 'move' ? 'secondary' : 'outline'} onClick={() => setTool('move')} disabled={isSaving}>
                            <Move className="mr-2 h-4 w-4" /> Move
                        </Button>
                        <Button variant={tool === 'pen' ? 'secondary' : 'outline'} onClick={() => setTool('pen')} disabled={isSaving}>
                            <Pen className="mr-2 h-4 w-4" /> Pen
                        </Button>
                        <Button variant={tool === 'brush' ? 'secondary' : 'outline'} onClick={() => setTool('brush')} disabled={isSaving}>
                            <Paintbrush className="mr-2 h-4 w-4" /> Brush
                        </Button>
                     </div>

                     {(tool === 'pen' || tool === 'brush') && (
                       <div className="w-full sm:w-[80%] flex flex-col items-center gap-4">
                          <div className="w-full sm:w-64 flex flex-col gap-4">
                              <div className="grid w-full items-center gap-2">
                                  <Label htmlFor="brush-size" className="flex items-center gap-2"><ZoomIn className="h-4 w-4" /> Brush Size</Label>
                                  <Slider
                                      id="brush-size"
                                      value={[brushSize]}
                                      min={1} max={50} step={1}
                                      onValueChange={(value) => setBrushSize(value[0])}
                                      disabled={isSaving}
                                  />
                              </div>
                              <div className="grid w-full items-center gap-2">
                                  <Label htmlFor="brush-color" className="flex items-center gap-2"><Palette className="h-4 w-4" /> Brush Color</Label>
                                  <Input
                                      id="brush-color" type="color"
                                      value={brushColor}
                                      onChange={(e) => setBrushColor(e.target.value)}
                                      className="p-1 h-10 w-full"
                                      disabled={isSaving}
                                  />
                              </div>
                          </div>
                       </div>
                     )}

                     {activeLayer && tool === 'move' && (
                       <div className="w-full sm:w-[80%] flex flex-col items-center gap-4">
                          <div className="w-full sm:w-64 flex flex-col gap-4">
                              <div className="grid w-full items-center gap-2">
                                  <Label htmlFor="scale-slider" className="flex items-center gap-2"><ZoomIn className="h-4 w-4" /> Scale</Label>
                                  <Slider
                                      id="scale-slider"
                                      value={[activeLayer.scale]}
                                      min={0.1} max={5} step={0.05}
                                      onValueChange={(value) => updateLayer(activeLayer.id, { scale: value[0] })}
                                      disabled={isSaving}
                                  />
                              </div>
                              <div className="grid w-full items-center gap-2">
                                  <Label htmlFor="tilt-slider" className="flex items-center gap-2"><RotateCw className="h-4 w-4" /> Tilt</Label>
                                  <Slider
                                      id="tilt-slider"
                                      value={[activeLayer.rotation]}
                                      min={-180} max={180} step={1}
                                      onValueChange={(value) => updateLayer(activeLayer.id, { rotation: value[0] })}
                                      disabled={isSaving}
                                  />
                              </div>
                               {activeLayer.type === 'text' && (
                                <>
                                    <div className="grid w-full items-center gap-2">
                                        <Label htmlFor="color-picker" className="flex items-center gap-2"><Palette className="h-4 w-4" /> Color</Label>
                                        <Input
                                            id="color-picker" type="color"
                                            value={activeLayer.color || '#ffffff'}
                                            onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })}
                                            className="p-1 h-10 w-full"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="grid w-full items-center gap-2">
                                        <Label htmlFor="font-select" className="flex items-center gap-2"><Type className="h-4 w-4" /> Font</Label>
                                        <Select
                                            value={activeLayer.fontFamily}
                                            onValueChange={(value) => updateLayer(activeLayer.id, { fontFamily: value })}
                                            disabled={isSaving}
                                        >
                                            <SelectTrigger id="font-select">
                                                <SelectValue placeholder="Select a font" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Impact" style={{fontFamily: 'Impact'}}>Impact</SelectItem>
                                                <SelectItem value="Anton" style={{fontFamily: 'Anton'}}>Anton</SelectItem>
                                                <SelectItem value="Bangers" style={{fontFamily: 'Bangers'}}>Bangers</SelectItem>
                                                <SelectItem value="Lobster" style={{fontFamily: 'Lobster'}}>Lobster</SelectItem>
                                                <SelectItem value="Arial" style={{fontFamily: 'Arial'}}>Arial</SelectItem>
                                                <SelectItem value="Comic Sans MS" style={{fontFamily: 'Comic Sans MS'}}>Comic Sans</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                               )}
                          </div>
                       </div>
                     )}
                     <div className="flex flex-wrap justify-center gap-2 pt-4 border-t w-full">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Add Image
                        </Button>
                        <Button variant="outline" onClick={() => addLayer('text', 'Edit Me', { width: 200, height: 50 })} disabled={isSaving}>
                            <Text className="mr-2 h-4 w-4" />
                            Add Text
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" disabled={isSaving}>
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
                         {activeLayer && activeLayer.type === 'image' && tool === 'move' && (
                            <Button variant="outline" onClick={handleRemoveBackground} disabled={isSaving}>
                                <ImageOff className="mr-2 h-4 w-4" />
                                Remove BG
                            </Button>
                        )}
                        <Button onClick={saveImage} disabled={isSaving || (layers.length === 0)}>
                            {isSaving ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Save
                        </Button>
                        <Button variant="outline" onClick={() => handleReset(false)} disabled={isSaving}>
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
