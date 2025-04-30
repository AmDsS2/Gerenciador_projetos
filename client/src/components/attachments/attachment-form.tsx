import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload } from "lucide-react";

// Formulário simples para upload de arquivos
const attachmentFormSchema = z.object({
  file: z.instanceof(File, { message: "Selecione um arquivo" }),
  description: z.string().optional(),
});

type AttachmentFormValues = z.infer<typeof attachmentFormSchema>;

interface AttachmentFormProps {
  entityType: "project" | "subproject" | "activity";
  entityId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AttachmentForm({ entityType, entityId, onSuccess, onCancel }: AttachmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form
  const form = useForm<AttachmentFormValues>({
    resolver: zodResolver(attachmentFormSchema),
    defaultValues: {
      description: "",
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      form.setValue("file", file);
    }
  };

  // Create attachment mutation
  const mutation = useMutation({
    mutationFn: async (values: AttachmentFormValues) => {
      const formData = new FormData();
      formData.append("file", values.file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId.toString());
      if (values.description) {
        formData.append("description", values.description);
      }

      return fetch("/api/attachments", {
        method: "POST",
        body: formData,
        credentials: "include",
      }).then(res => {
        if (!res.ok) throw new Error("Falha ao enviar o arquivo");
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh the attachments list
      queryClient.invalidateQueries({ queryKey: ["/api/attachments"] });
      
      toast({
        title: "Anexo adicionado",
        description: "O arquivo foi anexado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error uploading attachment:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao anexar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Submit handler
  const onSubmit = async (values: AttachmentFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Arquivo</Label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-primary/50">
            <input
              id="file"
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-2" 
                  onClick={() => {
                    setSelectedFile(null);
                    form.setValue("file", undefined as any);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <div className="text-center" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Clique para selecionar um arquivo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou arraste e solte aqui
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar arquivo
                </Button>
              </div>
            )}
          </div>
          {form.formState.errors.file && (
            <p className="text-sm text-destructive">{form.formState.errors.file.message}</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Descreva brevemente o arquivo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !selectedFile}
          >
            {isSubmitting && (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-background"></div>
            )}
            Anexar arquivo
          </Button>
        </div>
      </form>
    </Form>
  );
}