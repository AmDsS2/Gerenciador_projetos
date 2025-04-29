import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, Subproject, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ActivityForm } from "@/components/activities/activity-form";

interface KanbanViewProps {
  projectId: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  items: Activity[];
  bgColor: string;
}

export function KanbanView({ projectId }: KanbanViewProps) {
  const { toast } = useToast();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [draggingItem, setDraggingItem] = useState<Activity | null>(null);
  const [selectedSubproject, setSelectedSubproject] = useState<number | null>(null);
  const [showCreateActivity, setShowCreateActivity] = useState(false);

  // Fetch subprojects
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: [`/api/projects/${projectId}/subprojects`],
    enabled: !!projectId,
  });

  // Fetch activities for the selected subproject
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/subprojects/${selectedSubproject}/activities`],
    enabled: !!selectedSubproject,
  });

  // Fetch users for displaying responsible
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Update activity status mutation
  const updateActivityStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/activities/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subprojects/${selectedSubproject}/activities`] });
      toast({
        title: "Status atualizado",
        description: "O status da atividade foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da atividade.",
        variant: "destructive",
      });
    },
  });

  // Initialize kanban columns
  useEffect(() => {
    setColumns([
      {
        id: "todo",
        title: "Aguardando",
        status: "Aguardando",
        items: [],
        bgColor: "bg-gray-100",
      },
      {
        id: "inProgress",
        title: "Em Andamento",
        status: "Em andamento",
        items: [],
        bgColor: "bg-blue-50",
      },
      {
        id: "delayed",
        title: "Atrasado",
        status: "Atrasado",
        items: [],
        bgColor: "bg-red-50",
      },
      {
        id: "done",
        title: "Finalizado",
        status: "Finalizado",
        items: [],
        bgColor: "bg-green-50",
      },
    ]);
  }, []);

  // Set initial subproject if not already set
  useEffect(() => {
    if (!selectedSubproject && subprojects && subprojects.length > 0) {
      setSelectedSubproject(subprojects[0].id);
    }
  }, [subprojects, selectedSubproject]);

  // Distribute activities to columns
  useEffect(() => {
    if (activities) {
      const updatedColumns = columns.map((column) => {
        return {
          ...column,
          items: activities.filter((activity) => activity.status === column.status),
        };
      });
      setColumns(updatedColumns);
    }
  }, [activities]);

  const getUserName = (userId?: number | null) => {
    if (!userId || !users) return "Não atribuído";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Não atribuído";
  };

  const handleDragStart = (activity: Activity) => {
    setDraggingItem(activity);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (draggingItem && draggingItem.status !== columnStatus) {
      updateActivityStatusMutation.mutate({
        id: draggingItem.id,
        status: columnStatus,
      });
    }
    setDraggingItem(null);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle>Quadro Kanban</CardTitle>
            {subprojects && subprojects.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Subprojeto:</span>
                <select
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={selectedSubproject || ""}
                  onChange={(e) => setSelectedSubproject(Number(e.target.value))}
                >
                  {subprojects.map((subproject) => (
                    <option key={subproject.id} value={subproject.id}>
                      {subproject.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <Button onClick={() => setShowCreateActivity(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4 kanban-container">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className={`${column.bgColor} min-w-[280px] w-[280px] rounded-lg shadow-sm flex flex-col h-[70vh]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.status)}
                >
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-medium flex items-center justify-between">
                      {column.title}
                      <span className="bg-white text-xs rounded-full px-2 py-1">
                        {column.items.length}
                      </span>
                    </h3>
                  </div>
                  <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2">
                      {column.items.map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-white rounded-lg shadow p-3 cursor-grab"
                          draggable
                          onDragStart={() => handleDragStart(activity)}
                        >
                          <div className="font-medium text-sm mb-1">
                            {activity.name}
                          </div>
                          {activity.description && (
                            <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {activity.description}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 bg-primary">
                                <AvatarFallback>
                                  {getInitials(getUserName(activity.responsibleId))}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs ml-1 text-gray-600">
                                {getUserName(activity.responsibleId)}
                              </span>
                            </div>
                            {activity.dueDate && (
                              <div className="text-xs text-gray-500">
                                Vence: {formatDate(activity.dueDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {column.items.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          Nenhuma atividade
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Activity Dialog */}
      {selectedSubproject && (
        <Dialog open={showCreateActivity} onOpenChange={setShowCreateActivity}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Nova Atividade</DialogTitle>
            </DialogHeader>
            <ActivityForm
              subprojectId={selectedSubproject}
              onSuccess={() => setShowCreateActivity(false)}
              onCancel={() => setShowCreateActivity(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
