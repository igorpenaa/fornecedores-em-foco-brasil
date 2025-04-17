
import { Highlight } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HighlightsListProps {
  highlights: Highlight[];
  onEdit: (highlight: Highlight) => void;
  onDelete: (id: string) => void;
}

export function HighlightsList({ highlights, onEdit, onDelete }: HighlightsListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Mídia</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Criado</TableHead>
            <TableHead>Delay</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {highlights.map((highlight) => (
            <TableRow key={highlight.id}>
              <TableCell>
                {highlight.mediaType === "image" ? (
                  <img 
                    src={highlight.mediaUrl}
                    alt={highlight.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <video 
                    src={highlight.mediaUrl}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
              </TableCell>
              <TableCell className="font-medium">{highlight.title}</TableCell>
              <TableCell className="max-w-xs truncate">{highlight.description}</TableCell>
              <TableCell>{highlight.mediaType === "image" ? "Imagem" : "Vídeo"}</TableCell>
              <TableCell>
                {formatDistanceToNow(highlight.createdAt, {
                  addSuffix: true,
                  locale: ptBR
                })}
              </TableCell>
              <TableCell>{highlight.transitionDelay || 5}s</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {highlight.link && (
                    <a 
                      href={highlight.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Visitar link</span>
                    </a>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(highlight)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(highlight.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
