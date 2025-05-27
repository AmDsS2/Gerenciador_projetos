import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertActivitySchema, User, Subproject } from "@shared/types";
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
import { SLA_OPTIONS } from "@/lib/constants";

// Extend the insert schema with additional validation
const activityFormSchema = insertActivitySchema.extend({
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  sla: z.number().optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  subprojectId: number;
  initialValues?: ActivityFormValues;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ActivityForm({ subprojectId, initialValues, onSuccess, onCancel }: ActivityFormProps) {
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<{ title: string; completed: boolean }[]>(
    initialValues?.checklist || []
  );

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Set up form with default values or initial values
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: initialValues || {
      name: "",
      description: "",
      status: "Em andamento",
      subprojectId,
      checklist: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ActivityFormValues) => {
      // Include checklist state in the submitted data
      data.checklist = checklist;
      // Ensure subprojectId is set
      data.subprojectId = subprojectId;
      
      if (initialValues) {
        // Update existing activity
        return apiRequest("PUT", `/api/activities/${initialValues.id}`, data);
      } else {
        // Create new activity
        return apiRequest("POST", "/api/activities", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subprojects/${subprojectId}/activities`] });
      toast({
        title: initialValues ? "Atividade atualizada" : "Atividade criada",
        description: initialValues
          ? "A atividade foi atualizada com sucesso."
          : "A atividade foi criada com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao ${initialValues ? "atualizar" : "criar"} a atividade.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ActivityFormValues) => {
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
          {initialValues ? "Editar Atividade" : "Nova Atividade"}
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
                  <FormLabel>Nome da Atividade *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome da atividade" />
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
                      placeholder="Descrição detalhada da atividade"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Não atribuído</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sla"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SLA de execução</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um SLA" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Sem SLA definido</SelectItem>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Checklist da Tarefa</FormLabel>
              <div className="mt-2 space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox
                      id={`checklist-${index}`}
                      checked={item.completed}
                      onCheckedChange={(checked) =>
                        updateChecklist(index, !!checked)
                      }
                    />
                    <Input
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
                >
                  Adicionar Item
                </Button>
              </div>
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
              {initialValues ? "Atualizar Atividade" : "Criar Atividade"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
