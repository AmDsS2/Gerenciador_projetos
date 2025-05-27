import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subproject, User } from "@shared/types";
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
import { formatDate, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SubprojectForm } from "./subproject-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/components/ui/use-toast";
import { STATUS_COLORS } from "@/lib/constants";
import { api } from "@/lib/api";

interface SubprojectListProps {
  projectId: number;
  onCreateSubproject?: () => void;
}

export function SubprojectList({ projectId, onCreateSubproject }: SubprojectListProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [selectedSubproject, setSelectedSubproject] = useState<Subproject | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showActivitiesDialog, setShowActivitiesDialog] = useState(false);

  // Fetch subprojects
  const { data: subprojects, isLoading } = useQuery<Subproject[]>({
    queryKey: [`/api/projects/${projectId}/subprojects`],
    enabled: !!projectId,
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Delete subproject mutation
  const deleteSubprojectMutation = useMutation({
    mutationFn: async (subprojectId: number) => {
      return apiRequest("DELETE", `/api/subprojects/${subprojectId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/subprojects`] });
      toast({
        title: "Subprojeto excluído",
        description: "O subprojeto foi excluído com sucesso.",
      });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o subprojeto.",
        variant: "destructive",
      });
    },
  });

  const filteredSubprojects = subprojects
    ? subprojects.filter((subproject) =>
        subproject.name.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

  const handleDeleteSubproject = () => {
    if (selectedSubproject) {
      deleteSubprojectMutation.mutate(selectedSubproject.id);
    }
  };

  const getUserName = (userId?: number | null) => {
    if (!userId || !users) return "Não atribuído";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Não atribuído";
  };

  const handleEditClick = (subproject: Subproject) => {
    setSelectedSubproject(subproject);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (subproject: Subproject) => {
    setSelectedSubproject(subproject);
    setShowDeleteDialog(true);
  };

  const handleViewActivities = (subproject: Subproject) => {
    setSelectedSubproject(subproject);
    setShowActivitiesDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            <div className="flex-1">
              <Input
                placeholder="Filtrar subprojetos..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button onClick={onCreateSubproject}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Subprojeto
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
                    <TableHead>Nome do Subprojeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Término</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubprojects.length > 0 ? (
                    filteredSubprojects.map((subproject) => (
                      <TableRow key={subproject.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-medium">{subproject.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subproject.description &&
                              subproject.description.substring(0, 50) +
                                (subproject.description.length > 50 ? "..." : "")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`${STATUS_COLORS[subproject.status as keyof typeof STATUS_COLORS]?.bg} ${STATUS_COLORS[subproject.status as keyof typeof STATUS_COLORS]?.text}`}
                          >
                            {subproject.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 bg-primary">
                              <AvatarFallback>
                                {getInitials(getUserName(subproject.responsibleId))}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {getUserName(subproject.responsibleId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(subproject.startDate)}</TableCell>
                        <TableCell>{formatDate(subproject.endDate)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewActivities(subproject)}
                            >
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">Ver atividades</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditClick(subproject)}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteClick(subproject)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {subprojects && subprojects.length === 0
                          ? "Nenhum subprojeto cadastrado."
                          : "Nenhum subprojeto encontrado com o filtro aplicado."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subproject Dialog */}
      {selectedSubproject && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Subprojeto</DialogTitle>
            </DialogHeader>
            <SubprojectForm
              projectId={projectId}
              initialValues={selectedSubproject}
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
            <AlertDialogTitle>Excluir Subprojeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este subprojeto? Essa ação não pode ser desfeita e todas as atividades relacionadas também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubproject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubprojectMutation.isPending ? (
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
