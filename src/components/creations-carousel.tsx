'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from '@/hooks/use-mobile'
import Autoplay from 'embla-carousel-autoplay'

interface Creation {
  src: string;
  hint: string;
}

interface CreationsCarouselProps {
  creations: Creation[];
}

export function CreationsCarousel({ creations }: CreationsCarouselProps) {
  const isMobile = useIsMobile();
  const [shouldAutoplay, setShouldAutoplay] = useState(false);

  useEffect(() => {
    // isMobile can be undefined on first render, so we check if it's a boolean.
    if (typeof isMobile === 'boolean') {
      if (isMobile) {
        setShouldAutoplay(creations.length > 1);
      } else {
        // Desktop breakpoint starts at 768px.
        // User wants to autoplay if more than 2 items on desktop.
        setShouldAutoplay(creations.length > 2);
      }
    }
  }, [isMobile, creations.length]);

  const emblaPlugins = useMemo(() => {
    if (shouldAutoplay) {
      // Pause on hover/focus is default behavior
      return [Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })];
    }
    return [];
  }, [shouldAutoplay]);

  return (
    <Carousel
        opts={{
            align: "start",
            loop: true,
        }}
        plugins={emblaPlugins}
        className="w-full"
    >
        <CarouselContent>
            {creations.map((creation, index) => (
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
  )
}
