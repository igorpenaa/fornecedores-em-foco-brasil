
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StarRating } from "./star-rating";
import { Supplier, Issue } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface RatingDialogProps {
  supplier: Supplier;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (supplierId: string, rating: number, comment: string, issues: string[]) => Promise<void>;
}

export function RatingDialog({ supplier, isOpen, onClose, onSubmit }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock issues data - in a real app, you would fetch this from a database
  useEffect(() => {
    const mockIssues: Issue[] = [
      { id: "1", name: "Atendimento ruim", createdAt: new Date() },
      { id: "2", name: "Preços altos", createdAt: new Date() },
      { id: "3", name: "Qualidade inferior", createdAt: new Date() },
      { id: "4", name: "Atraso na entrega", createdAt: new Date() },
      { id: "5", name: "Comunicação ruim", createdAt: new Date() },
    ];
    
    setIssues(mockIssues);
  }, []);

  // Load existing rating if the user is re-rating
  useEffect(() => {
    if (user && supplier.ratings && isOpen) {
      const existingRating = supplier.ratings.find(r => r.userId === user.id);
      
      if (existingRating) {
        setRating(existingRating.rating);
        setComment(existingRating.comment || "");
        setSelectedIssues(existingRating.issues || []);
      } else {
        // Reset form for new ratings
        setRating(0);
        setComment("");
        setSelectedIssues([]);
      }
    }
  }, [user, supplier, isOpen]);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const toggleIssue = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        variant: "destructive",
        title: "Avaliação obrigatória",
        description: "Por favor, selecione uma classificação por estrelas."
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "É necessário estar logado para avaliar."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(supplier.id, rating, comment, selectedIssues);
      toast({
        title: "Avaliação enviada",
        description: "Obrigado por compartilhar sua opinião!"
      });
      // Reset form
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar sua avaliação. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Avalie {supplier.name}</DialogTitle>
          <DialogDescription>
            Sua avaliação ajuda outros usuários a encontrar os melhores fornecedores.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-2">
            <span className="text-sm font-medium mb-1">Avalie sua experiência</span>
            <StarRating
              rating={rating}
              editable={true}
              onChange={handleRatingChange}
              size={32}
              className="mb-2"
            />
            <span className="text-sm text-muted-foreground">
              {rating === 1 && "Péssimo"}
              {rating === 2 && "Ruim"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Bom"}
              {rating === 5 && "Excelente"}
            </span>
          </div>
          
          {rating <= 3 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selecione os problemas (até 5)</h3>
              <div className="grid grid-cols-2 gap-2">
                {issues.map((issue) => (
                  <div key={issue.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`issue-${issue.id}`} 
                      checked={selectedIssues.includes(issue.id)}
                      onCheckedChange={() => toggleIssue(issue.id)}
                      disabled={!selectedIssues.includes(issue.id) && selectedIssues.length >= 5}
                    />
                    <label 
                      htmlFor={`issue-${issue.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {issue.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Compartilhe sua experiência com este fornecedor..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
