
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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>(highlight?.mediaUrl || '');
  const { addHighlight, updateHighlight, uploadHighlightMedia } = useData();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor selecione um arquivo de imagem.",
      });
      return;
    }
    
    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor selecione um arquivo de vídeo.",
      });
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB.",
      });
      return;
    }
    
    setMediaFile(file);
    
    // Create a preview
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const uploadMedia = async () => {
    if (!mediaFile) {
      // If we're editing and not changing the media
      if (highlight?.mediaUrl) {
        return {
          url: highlight.mediaUrl,
          publicId: highlight.mediaUrl.split('/').pop() || '',
          mediaType: highlight.mediaType
        };
      }
      
      throw new Error("Nenhum arquivo selecionado");
    }
    
    setUploading(true);
    
    try {
      const result = await uploadHighlightMedia(mediaFile);
      return result;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setUploading(true);
      
      // First upload the media if there is a new file
      let mediaData;
      if (mediaFile || !highlight) {
        try {
          mediaData = await uploadMedia();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Erro no upload",
            description: "Não foi possível fazer o upload do arquivo. Tente novamente.",
          });
          setUploading(false);
          return;
        }
      }
      
      const highlightData = {
        title: data.title,
        description: data.description,
        mediaUrl: mediaData?.url || highlight?.mediaUrl || '',
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
          <FormLabel>Arquivo {mediaType === 'image' ? 'de Imagem' : 'de Vídeo'}</FormLabel>
          <div className="flex flex-col space-y-4">
            <Input 
              type="file" 
              accept={mediaType === 'image' ? "image/*" : "video/*"} 
              onChange={handleFileChange}
            />
            <FormDescription>
              Selecione um {mediaType === 'image' ? 'arquivo de imagem' : 'arquivo de vídeo'} de até 10MB.
            </FormDescription>
          </div>
          
          {mediaPreview && (
            <div className="mt-4 border rounded-md overflow-hidden">
              {mediaType === 'image' ? (
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
              ) : (
                <video 
                  src={mediaPreview} 
                  controls 
                  className="w-full h-48 object-cover"
                />
              )}
            </div>
          )}
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
