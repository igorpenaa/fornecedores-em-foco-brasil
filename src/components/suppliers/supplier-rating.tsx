
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Supplier } from "@/types";
import { StarRating } from "@/components/ratings/star-rating";
import { RatingDialog } from "@/components/ratings/rating-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/data-context";

interface SupplierRatingProps {
  supplier: Supplier;
  onRateSupplier?: (supplierId: string, rating: number, comment: string, issues: string[]) => Promise<void>;
}

export function SupplierRating({ supplier, onRateSupplier }: SupplierRatingProps) {
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { rateSupplier } = useData();
  
  const handleRateClick = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login necessário",
        description: "Você precisa estar logado para avaliar um fornecedor."
      });
      return;
    }
    
    setIsRatingDialogOpen(true);
  };
  
  // Default implementation that uses the context's rateSupplier
  const handleSubmitRating = async (supplierId: string, rating: number, comment: string, issues: string[]) => {
    if (onRateSupplier) {
      return onRateSupplier(supplierId, rating, comment, issues);
    }
    
    // Default implementation using the data context
    return rateSupplier(supplierId, rating, comment, issues);
  };
  
  // Helper function to format the average rating
  const formatRating = (rating: number | undefined) => {
    if (!rating) return "Sem avaliações";
    return rating.toFixed(1);
  };
  
  // Helper function to get the number of ratings
  const getRatingCount = () => {
    return supplier.ratings?.length || 0;
  };
  
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <StarRating 
            rating={supplier.averageRating || 0} 
            size={16}
          />
          <span className="text-sm font-medium">
            {formatRating(supplier.averageRating)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({getRatingCount()})
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs" 
          onClick={handleRateClick}
        >
          Avaliar
        </Button>
      </div>
      
      <RatingDialog 
        supplier={supplier}
        isOpen={isRatingDialogOpen}
        onClose={() => setIsRatingDialogOpen(false)}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}
