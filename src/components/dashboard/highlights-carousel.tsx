import { useState, useEffect, useRef } from "react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAuth } from "@/contexts/auth-context";
import { Highlight } from "@/types";
import { useData } from "@/contexts/data-context";

interface HighlightsCarouselProps {
  disabled?: boolean;
  onUpgradeRequired: () => void;
}

export function HighlightsCarousel({ disabled = false, onUpgradeRequired }: HighlightsCarouselProps) {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const { user } = useAuth();
  const { highlights } = useData();
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (!api || highlights.length <= 1) return;
    
    const setupTimer = () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
      
      const currentHighlight = highlights[current];
      const delay = (currentHighlight?.transitionDelay || 5) * 1000;
      
      autoplayTimerRef.current = setTimeout(() => {
        const nextIndex = (current + 1) % highlights.length;
        api.scrollTo(nextIndex);
      }, delay);
    };
    
    setupTimer();
    
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [api, current, highlights]);

  const handleHighlightClick = (e: React.MouseEvent, link: string | undefined) => {
    if (disabled) {
      e.preventDefault();
      onUpgradeRequired();
      return;
    }
    
    if (link) {
      window.location.href = link;
    }
  };

  if (highlights.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[300px] md:h-[400px]">
      <Carousel setApi={setApi} className="w-full h-full">
        <CarouselContent className="h-full">
          {highlights.map((highlight) => (
            <CarouselItem key={highlight.id} className="h-full">
              <a 
                href={highlight.link || "#"} 
                className={`block h-full w-full relative ${disabled ? 'opacity-70' : ''}`}
                onClick={(e) => handleHighlightClick(e, highlight.link)}
              >
                {highlight.mediaType === "image" ? (
                  <img 
                    src={highlight.mediaUrl} 
                    alt={highlight.title} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <video 
                    src={highlight.mediaUrl} 
                    className="w-full h-full object-cover rounded-lg" 
                    autoPlay 
                    muted 
                    loop
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                  <h2 className="text-2xl md:text-3xl font-bold">{highlight.title}</h2>
                  <p className="text-lg md:text-xl">{highlight.description}</p>
                </div>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2 h-2 rounded-full ${
                current === index ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
      
      {(user?.role === "master" || user?.role === "admin") && (
        <div className="absolute top-4 right-4 z-10">
          <a 
            href="/highlights" 
            className="bg-primary/80 hover:bg-primary text-white px-4 py-2 rounded-md text-sm"
          >
            Gerenciar Destaques
          </a>
        </div>
      )}
    </div>
  );
}
