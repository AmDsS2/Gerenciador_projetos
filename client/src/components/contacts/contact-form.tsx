import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertContactSchema, Contact } from "@shared/schema";

const contactFormSchema = insertContactSchema.extend({
  // Additional client-side validations if needed
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional().nullable(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  projectId: number;
  onSuccess: () => void;
  onCancel: () => void;
  initialValues?: Partial<Contact>;
}

export function ContactForm({ projectId, onSuccess, onCancel, initialValues }: ContactFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default form values
  const defaultValues: Partial<ContactFormValues> = {
    projectId,
    name: initialValues?.name || "",
    role: initialValues?.role || "",
    email: initialValues?.email || "",
    phone: initialValues?.phone || "",
    notes: initialValues?.notes || "",
  };

  // Form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  // Create/update mutation
  const mutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      if (initialValues?.id) {
        // Update existing contact
        return apiRequest("PUT", `/api/contacts/${initialValues.id}`, values);
      } else {
        // Create new contact
        return apiRequest("POST", "/api/contacts", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/contacts`] });
      toast({
        title: initialValues?.id ? "Contato atualizado" : "Contato adicionado",
        description: initialValues?.id
          ? "O contato foi atualizado com sucesso."
          : "O novo contato foi adicionado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error saving contact:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o contato. Tente novamente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Submit handler
  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do contato" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Cargo do contato" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email do contato" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="Telefone do contato" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Observações sobre o contato"
                  {...field}
                  value={field.value || ""}
                ></textarea>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-background"></div>
            )}
            {initialValues?.id ? "Atualizar Contato" : "Adicionar Contato"}
          </Button>
        </div>
      </form>
    </Form>
  );
}