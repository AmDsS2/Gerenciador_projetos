import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Subproject, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";
import { Plus, Calendar, CheckSquare, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityForm } from "./activity-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { STATUS_COLORS } from "@/lib/constants";
import { differenceInDays } from "date-fns";

interface ActivityListProps {
  subprojectId?: number;
  showAll?: boolean;
  onCreateActivity?: () => void;
}

export function ActivityList({ subprojectId, showAll = false, onCreateActivity }: ActivityListProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch activities based on whether to show all or only for a specific subproject
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: showAll ? ["/api/activities"] : [`/api/subprojects/${subprojectId}/activities`],
    enabled: showAll || !!subprojectId,
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // If showing all activities, we need to fetch subprojects to display their names
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: ["/api/subprojects"],
    enabled: showAll,
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      return apiRequest("DELETE", `/api/activities/${activityId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: showAll ? ["/api/activities"] : [`/api/subprojects/${subprojectId}/activities`],
      });
      toast({
        title: "Atividade excluída",
        description: "A atividade foi excluída com sucesso.",
      });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a atividade.",
        variant: "destructive",
      });
    },
  });

  const filteredActivities = activities
    ? activities.filter((activity) =>
        activity.name.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

  const handleDeleteActivity = () => {
    if (selectedActivity) {
      deleteActivityMutation.mutate(selectedActivity.id);
    }
  };

  const getUserName = (userId?: number | null) => {
    if (!userId || !users) return "Não atribuído";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Não atribuído";
  };

  const getSubprojectName = (subprojectId?: number | null) => {
    if (!subprojectId || !subprojects) return "Desconhecido";
    const subproject = subprojects.find((s) => s.id === subprojectId);
    return subproject ? subproject.name : "Desconhecido";
  };

  const getSLAStatus = (activity: Activity) => {
    if (!activity.dueDate) return null;
    
    const dueDate = new Date(activity.dueDate);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);
    
    if (activity.status === "Finalizado") {
      return { status: "complete", message: "Concluído" };
    }
    
    if (daysUntilDue < 0) {
      return {
        status: "overdue",
        message: `${Math.abs(daysUntilDue)} dias atrasado`,
      };
    }
    
    if (daysUntilDue <= (activity.sla || 0)) {
      return {
        status: "warning",
        message: `${daysUntilDue} dias restantes`,
      };
    }
    
    return {
      status: "ok",
      message: "Em dia",
    };
  };

  const handleEditClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            <div className="flex-1">
              <Input
                placeholder="Filtrar atividades..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button onClick={onCreateActivity}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Atividade</TableHead>
                    {showAll && <TableHead>Subprojeto</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => {
                      const slaStatus = getSLAStatus(activity);
                      return (
                        <TableRow key={activity.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium">{activity.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {activity.description &&
                                activity.description.substring(0, 50) +
                                  (activity.description.length > 50 ? "..." : "")}
                            </div>
                          </TableCell>
                          {showAll && (
                            <TableCell>
                              {getSubprojectName(activity.subprojectId)}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={`${STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS]?.bg} ${STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS]?.text}`}
                            >
                              {activity.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 bg-primary">
                                <AvatarFallback>
                                  {getInitials(getUserName(activity.responsibleId))}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {getUserName(activity.responsibleId)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(activity.startDate)}</TableCell>
                          <TableCell>{formatDate(activity.dueDate)}</TableCell>
                          <TableCell>
                            {slaStatus && (
                              <span className={`flex items-center ${
                                slaStatus.status === "overdue" ? "text-destructive" :
                                slaStatus.status === "warning" ? "text-warning" :
                                slaStatus.status === "complete" ? "text-secondary" :
                                "text-success"
                              }`}>
                                {slaStatus.status === "overdue" ? (
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                ) : slaStatus.status === "warning" ? (
                                  <span className="material-icons text-sm mr-1">warning</span>
                                ) : slaStatus.status === "complete" ? (
                                  <CheckSquare className="h-4 w-4 mr-1" />
                                ) : (
                                  <span className="material-icons text-sm mr-1">check_circle</span>
                                )}
                                {slaStatus.message}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditClick(activity)}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteClick(activity)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={showAll ? 8 : 7} className="h-24 text-center">
                        {activities && activities.length === 0
                          ? "Nenhuma atividade cadastrada."
                          : "Nenhuma atividade encontrada com o filtro aplicado."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Activity Dialog */}
      {selectedActivity && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Atividade</DialogTitle>
            </DialogHeader>
            <ActivityForm
              subprojectId={selectedActivity.subprojectId!}
              initialValues={selectedActivity}
              onSuccess={() => setShowEditDialog(false)}
              onCancel={() => setShowEditDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Atividade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta atividade? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteActivityMutation.isPending ? (
                <span className="animate-spin mr-2">⭘</span>
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
