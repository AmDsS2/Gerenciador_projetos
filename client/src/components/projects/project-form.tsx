import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SLA_OPTIONS, DEFAULT_PROJECT_CHECKLIST } from "@/lib/constants";
import { User } from "@shared/schema";

// Extend the insert schema with additional validation
const projectFormSchema = insertProjectSchema.extend({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sla: z.number().optional(),
  checklist: z.array(z.object({
    title: z.string(),
    completed: z.boolean()
  })).optional(),
  id: z.number().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  initialValues?: ProjectFormValues & { id?: number };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectForm({ initialValues, onSuccess, onCancel }: ProjectFormProps) {
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<{ title: string; completed: boolean }[]>(
    initialValues?.checklist || DEFAULT_PROJECT_CHECKLIST
  );

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Set up form with default values or initial values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialValues || {
      name: "",
      description: "",
      status: "Em andamento",
      municipality: "",
      checklist: DEFAULT_PROJECT_CHECKLIST,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      sla: 30,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Include checklist state in the submitted data
      const projectData = {
        ...data,
        checklist: checklist as { title: string; completed: boolean }[],
        responsibleId: 1, // ID do usuário admin
      };
      
      // Remove id from projectData if it exists
      if (projectData.id) {
        delete projectData.id;
      }
      
      console.log("Enviando dados do projeto:", projectData);
      
      if (initialValues?.id) {
        // Update existing project
        return apiRequest("PUT", `/api/projects/${initialValues.id}`, projectData);
      } else {
        // Create new project
        return apiRequest("POST", "/api/projects", projectData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: initialValues ? "Projeto atualizado" : "Projeto criado",
        description: initialValues
          ? "O projeto foi atualizado com sucesso."
          : "O projeto foi criado com sucesso.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      console.error("Erro na mutação:", error);
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao ${initialValues ? "atualizar" : "criar"} o projeto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    mutation.mutate(data);
  };

  // Handle checklist changes
  const updateChecklist = (index: number, completed: boolean) => {
    const newChecklist = [...checklist];
    newChecklist[index].completed = completed;
    setChecklist(newChecklist);
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, { title: "", completed: false }]);
  };

  const updateChecklistTitle = (index: number, title: string) => {
    const newChecklist = [...checklist];
    newChecklist[index].title = title;
    setChecklist(newChecklist);
  };

  const removeChecklistItem = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist.splice(index, 1);
    setChecklist(newChecklist);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {initialValues ? "Editar Projeto" : "Novo Projeto"}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="project-name">Nome do Projeto *</FormLabel>
                  <FormControl>
                    <Input 
                      id="project-name"
                      name="project-name"
                      autoComplete="off"
                      aria-required="true"
                      aria-describedby="project-name-error"
                      {...field} 
                      placeholder="Nome do projeto" 
                    />
                  </FormControl>
                  <FormMessage id="project-name-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="project-description">Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      id="project-description"
                      name="project-description"
                      autoComplete="off"
                      aria-label="Descrição do projeto"
                      aria-describedby="project-description-error"
                      {...field}
                      placeholder="Descrição detalhada do projeto"
                      rows={3}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage id="project-description-error" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="project-status">Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger 
                          id="project-status" 
                          name="project-status"
                          aria-required="true"
                          aria-describedby="project-status-error"
                        >
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage id="project-status-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="municipality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="project-municipality">Município</FormLabel>
                    <FormControl>
                      <Input 
                        id="project-municipality"
                        name="project-municipality"
                        autoComplete="address-level2"
                        aria-label="Município do projeto"
                        aria-describedby="project-municipality-error"
                        {...field} 
                        placeholder="Município" 
                        value={field.value ?? ""} 
                      />
                    </FormControl>
                    <FormMessage id="project-municipality-error" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel htmlFor="project-start-date">Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id="project-start-date"
                            name="project-start-date"
                            type="button"
                            aria-label="Selecionar data de início"
                            aria-describedby="project-start-date-error"
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() ||
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage id="project-start-date-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel htmlFor="project-end-date">Data de Término</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id="project-end-date"
                            name="project-end-date"
                            type="button"
                            aria-label="Selecionar data de término"
                            aria-describedby="project-end-date-error"
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage id="project-end-date-error" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsibleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="project-responsible">Responsável</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger 
                          id="project-responsible" 
                          name="project-responsible"
                          aria-label="Selecionar responsável"
                          aria-describedby="project-responsible-error"
                        >
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage id="project-responsible-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="project-sla">SLA (Prazo de resposta)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger 
                          id="project-sla" 
                          name="project-sla"
                          aria-label="Selecionar SLA"
                          aria-describedby="project-sla-error"
                        >
                          <SelectValue placeholder="Selecione um SLA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SLA_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage id="project-sla-error" />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="project-checklist">Checklist por Município</FormLabel>
              <div id="project-checklist" className="mt-2 space-y-2" role="list" aria-describedby="project-checklist-error">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2" role="listitem">
                    <Checkbox
                      id={`checklist-${index}`}
                      name={`checklist-${index}`}
                      aria-label={`Item ${index + 1} da checklist`}
                      checked={item.completed}
                      onCheckedChange={(checked) =>
                        updateChecklist(index, !!checked)
                      }
                    />
                    <Input
                      id={`checklist-title-${index}`}
                      name={`checklist-title-${index}`}
                      autoComplete="off"
                      aria-label={`Título do item ${index + 1}`}
                      value={item.title}
                      onChange={(e) =>
                        updateChecklistTitle(index, e.target.value)
                      }
                      className="flex-1"
                      placeholder="Item da checklist"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                      aria-label={`Remover item ${index + 1}`}
                    >
                      <span className="material-icons text-sm">delete</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChecklistItem}
                  className="mt-2"
                  aria-label="Adicionar novo item à checklist"
                >
                  Adicionar Item
                </Button>
              </div>
              <FormMessage id="project-checklist-error" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <span className="animate-spin mr-2">⭘</span>
              ) : null}
              {initialValues ? "Atualizar Projeto" : "Criar Projeto"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
