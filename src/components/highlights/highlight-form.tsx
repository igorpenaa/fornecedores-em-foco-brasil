
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Highlight } from "@/types";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { CloudinaryUploader } from "@/components/uploads/CloudinaryUploader";

const formSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  link: z.string().url("Informe uma URL válida").or(z.string().length(0)).optional(),
  transitionDelay: z.coerce.number().min(1, "O tempo mínimo é 1 segundo").max(20, "O tempo máximo é 20 segundos"),
});

type FormValues = z.infer<typeof formSchema>;

interface HighlightFormProps {
  highlight: Highlight | null;
  onClose: () => void;
}

export function HighlightForm({ highlight, onClose }: HighlightFormProps) {
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(highlight?.mediaType || 'image');
  const [mediaUrl, setMediaUrl] = useState<string>(highlight?.mediaUrl || '');
  const { addHighlight, updateHighlight } = useData();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: highlight?.title || "",
      description: highlight?.description || "",
      link: highlight?.link || "",
      transitionDelay: highlight?.transitionDelay || 5,
    },
  });

  const handleUploadSuccess = (url: string, type: 'image' | 'video') => {
    console.log("Upload bem-sucedido:", url, type);
    setMediaUrl(url);
    toast({
      title: "Upload concluído",
      description: "Arquivo enviado com sucesso!",
    });
  };

  const handleUploadError = (error: string) => {
    console.error("Erro no upload:", error);
    toast({
      variant: "destructive",
      title: "Erro no upload",
      description: error,
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (!mediaUrl && !highlight?.mediaUrl) {
        toast({
          variant: "destructive",
          title: "Mídia obrigatória",
          description: "Por favor, faça o upload de uma mídia para o destaque.",
        });
        return;
      }

      setUploading(true);
      
      const highlightData = {
        title: data.title,
        description: data.description,
        mediaUrl: mediaUrl || highlight?.mediaUrl || '',
        mediaType,
        link: data.link || '',
        transitionDelay: data.transitionDelay
      };
      
      console.log("Salvando destaque:", highlightData);
      
      if (highlight) {
        await updateHighlight(highlight.id, highlightData);
        toast({
          title: "Destaque atualizado",
          description: "O destaque foi atualizado com sucesso.",
        });
      } else {
        await addHighlight(highlightData);
        toast({
          title: "Destaque adicionado",
          description: "O destaque foi adicionado com sucesso.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao salvar destaque:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o destaque. Tente novamente.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Digite o título do destaque" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Digite a descrição do destaque" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com" {...field} />
              </FormControl>
              <FormDescription>
                Se informado, o destaque irá redirecionar para este link quando clicado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="transitionDelay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo de Transição (segundos)</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={20} {...field} />
              </FormControl>
              <FormDescription>
                Tempo em segundos que o destaque ficará visível antes de passar para o próximo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-3">
          <FormLabel>Tipo de Mídia</FormLabel>
          <RadioGroup 
            value={mediaType} 
            onValueChange={(value) => setMediaType(value as 'image' | 'video')}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <label htmlFor="image">Imagem</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="video" />
              <label htmlFor="video">Vídeo</label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-3">
          <FormLabel>Upload de {mediaType === 'image' ? 'Imagem' : 'Vídeo'}</FormLabel>
          <CloudinaryUploader
            mediaType={mediaType}
            initialPreview={highlight?.mediaUrl}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>
        
        <div className="flex justify-end space-x-4 pt-4 sticky bottom-0 bg-background pb-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {highlight ? "Atualizar" : "Adicionar"} Destaque
          </Button>
        </div>
      </form>
    </Form>
  );
}
