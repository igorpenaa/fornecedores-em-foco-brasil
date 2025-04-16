
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Ad } from "@/types";
import { Card } from "@/components/ui/card";

export function AdsDisplay() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const { user } = useAuth();

  // Mock data for ads
  useEffect(() => {
    // Mock ads with embed codes
    const mockAds: Ad[] = [
      {
        id: "1",
        title: "Google AdSense Banner",
        embedCode: '<div class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg flex items-center justify-between"><div><h3 class="font-bold text-lg">Google Ads</h3><p>Anuncie seu negócio e aumente suas vendas!</p></div><button class="bg-white text-blue-600 px-4 py-2 rounded-md font-medium">Saiba mais</button></div>',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "2",
        title: "YouTube Promotion",
        embedCode: '<div class="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-lg flex items-center justify-between"><div><h3 class="font-bold text-lg">YouTube Premium</h3><p>Assista sem anúncios e baixe vídeos!</p></div><button class="bg-white text-red-600 px-4 py-2 rounded-md font-medium">Experimente</button></div>',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "3",
        title: "Affiliate Program",
        embedCode: '<div class="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-lg flex items-center justify-between"><div><h3 class="font-bold text-lg">Programa de Afiliados</h3><p>Ganhe comissão indicando nossos produtos!</p></div><button class="bg-white text-green-600 px-4 py-2 rounded-md font-medium">Participe</button></div>',
        isActive: true,
        createdAt: new Date()
      }
    ];
    
    setAds(mockAds.filter(ad => ad.isActive));
  }, []);

  // Rotate ads every 10 seconds
  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];
  
  return (
    <div className="relative">
      <Card className="overflow-hidden">
        <div dangerouslySetInnerHTML={{ __html: currentAd.embedCode }} />
      </Card>
      
      {/* Admin edit button */}
      {(user?.role === "master" || user?.role === "admin") && (
        <div className="absolute top-2 right-2">
          <a 
            href="/ads" 
            className="bg-primary/80 hover:bg-primary text-white px-3 py-1 rounded-md text-xs"
          >
            Gerenciar Anúncios
          </a>
        </div>
      )}
    </div>
  );
}
