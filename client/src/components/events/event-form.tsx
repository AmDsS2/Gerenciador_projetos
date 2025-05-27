import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEventSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Subproject } from "@shared/schema";

// Extend the insert schema with additional validation
const eventFormSchema = insertEventSchema.extend({
  startDate: z.date(),
  endDate: z.date().optional(),
});

interface EventFormValues {
  title: string;
  description?: string | null;
  location?: string | null;
  projectId?: number | null;
  subprojectId?: number | null;
  startDate: Date;
  endDate?: Date;
  createdBy: number;
  id?: number;
}

interface EventFormProps {
  projectId?: number;
  subprojectId?: number;
  initialValues?: Partial<EventFormValues>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ projectId, subprojectId, initialValues, onSuccess, onCancel }: EventFormProps) {
  const { toast } = useToast();

  // Fetch subprojects if project is selected
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: [`/api/projects/${projectId}/subprojects`],
    enabled: !!projectId,
  });

  // Set up form with default values or initial values
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      location: initialValues?.location || "",
      projectId: projectId || null,
      subprojectId: subprojectId || null,
      startDate: initialValues?.startDate || new Date(),
      endDate: initialValues?.endDate || undefined,
      createdBy: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      // Garantir que as datas sejam válidas
      if (!(data.startDate instanceof Date) || isNaN(data.startDate.getTime())) {
        throw new Error("Data de início inválida");
      }

      if (data.endDate && (!(data.endDate instanceof Date) || isNaN(data.endDate.getTime()))) {
        throw new Error("Data de término inválida");
      }

      const eventData = {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        location: data.location?.trim() || "",
        projectId: data.projectId || null,
        subprojectId: data.subprojectId || null,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate ? data.endDate.toISOString() : null,
        createdBy: 1,
      };

      console.log("Enviando dados do evento:", eventData);

      if (data.id) {
        return apiRequest("PUT", `/api/events/${data.id}`, eventData);
      } else {
        return apiRequest("POST", "/api/events", eventData);
      }
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a eventos
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: initialValues?.id ? "Evento atualizado" : "Evento criado",
        description: initialValues?.id
          ? "O evento foi atualizado com sucesso."
          : "O evento foi criado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Erro ao salvar evento:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o evento.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormValues) => {
    const formData = {
      ...data,
      description: data.description?.trim() || "",
      location: data.location?.trim() || "",
      id: initialValues?.id,
    };
    mutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Evento *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Digite o título do evento" />
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
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Descreva o evento detalhadamente"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder="Local do evento" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          formatDate(field.value)
                        ) : (
                          <span className="text-muted-foreground">
                            Selecione uma data
                          </span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Término</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          formatDate(field.value)
                        ) : (
                          <span className="text-muted-foreground">
                            Selecione uma data
                          </span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) =>
                        form.getValues().startDate &&
                        date < form.getValues().startDate
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {projectId === undefined && (
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const numValue = value ? parseInt(value) : null;
                    field.onChange(numValue);
                    // Reset subproject when project changes
                    form.setValue("subprojectId", null);
                  }}
                  value={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    {/* Project options would go here */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {subprojectId === undefined && (
          <FormField
            control={form.control}
            name="subprojectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subprojeto</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const numValue = value ? parseInt(value) : null;
                    field.onChange(numValue);
                  }}
                  value={field.value?.toString() || ""}
                  disabled={!form.getValues().projectId && !projectId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um subprojeto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    {subprojects?.map((subproject) => (
                      <SelectItem
                        key={subproject.id}
                        value={subproject.id.toString()}
                      >
                        {subproject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-background"></div>
            )}
            {initialValues?.id ? "Atualizar Evento" : "Criar Evento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}