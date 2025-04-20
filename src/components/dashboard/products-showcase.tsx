import { useState, useEffect } from "react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi
} from "@/components/ui/carousel";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/utils";

interface ProductsShowcaseProps {
  disabled?: boolean;
  onUpgradeRequired: () => void;
}

export function ProductsShowcase({ disabled = false, onUpgradeRequired }: ProductsShowcaseProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const mockProducts: Product[] = Array.from({ length: 30 }).map((_, i) => ({
      id: `product-${i + 1}`,
      name: `Produto ${i + 1}`,
      description: `Descrição do produto ${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 50,
      mediaUrl: `https://picsum.photos/seed/product${i + 1}/300/300`,
      mediaType: 'image',
      createdAt: new Date(),
    }));
    
    setProducts(mockProducts);
  }, []);

  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleProductClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      onUpgradeRequired();
    }
  };

  const itemsPerPage = 10; // 2 rows of 5 items

  if (products.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
        {(user?.role === "master" || user?.role === "admin") && (
          <a 
            href="/products" 
            className="bg-primary/80 hover:bg-primary text-white px-4 py-2 rounded-md text-sm"
          >
            Gerenciar Produtos
          </a>
        )}
      </div>
      
      <div className="relative">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {Array.from({ length: totalPages }).map((_, page) => (
              <CarouselItem key={page}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {products
                    .slice(page * itemsPerPage, (page + 1) * itemsPerPage)
                    .map((product) => (
                      <Card key={product.id} className={`overflow-hidden ${disabled ? 'opacity-70' : ''}`}>
                        <div className="aspect-square overflow-hidden">
                          {product.mediaType === "image" ? (
                            <img
                              src={product.mediaUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={product.mediaUrl}
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              loop
                            />
                          )}
                        </div>
                        <CardContent className="p-3">
                          <CardTitle className="text-sm truncate">{product.name}</CardTitle>
                          <p className="text-lg font-bold text-primary mt-1">
                            {formatCurrency(product.price)}
                          </p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0">
                          <Button 
                            className="w-full text-xs h-8" 
                            variant="secondary"
                            onClick={handleProductClick}
                          >
                            Ver detalhes
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </Carousel>
        
        {/* Page indicator */}
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2 h-2 rounded-full ${
                current === index ? "bg-primary" : "bg-gray-300"
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
