import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Project, Subproject, ProjectUpdate, Contact, User, Attachment } from "@shared/schema";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubprojectList } from "@/components/subprojects/subproject-list";
import { SubprojectForm } from "@/components/subprojects/subproject-form";
import { KanbanView } from "@/components/kanban/kanban-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { GanttView } from "@/components/gantt/gantt-view";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2, Upload, Calendar, CheckSquare, ClipboardList, Plus, FileText } from "lucide-react";
import { ProjectForm } from "./project-form";
import { STATUS_COLORS } from "@/lib/constants";

interface ProjectDetailProps {
  projectId: number;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditProject, setShowEditProject] = useState(false);
  const [showCreateSubproject, setShowCreateSubproject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newUpdate, setNewUpdate] = useState("");

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });

  // Fetch subprojects
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: [`/api/projects/${projectId}/subprojects`],
    enabled: !!projectId,
  });

  // Fetch project updates
  const { data: updates } = useQuery<ProjectUpdate[]>({
    queryKey: [`/api/projects/${projectId}/updates`],
    enabled: !!projectId,
  });

  // Fetch project contacts
  const { data: contacts } = useQuery<Contact[]>({
    queryKey: [`/api/projects/${projectId}/contacts`],
    enabled: !!projectId,
  });

  // Fetch users for responsible assignment
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch attachments
  const { data: attachments } = useQuery<Attachment[]>({
    queryKey: ["/api/attachments"],
    queryFn: async () => {
      const res = await fetch(`/api/attachments?entityType=project&entityId=${projectId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch attachments");
      return res.json();
    },
    enabled: !!projectId,
  });

  // Add project update mutation
  const addUpdateMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/project-updates", {
        projectId,
        content,
        userId: null, // Will be set by the server based on the authenticated user
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/updates`] });
      setNewUpdate("");
      toast({
        title: "Atualização adicionada",
        description: "A atualização foi adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a atualização.",
        variant: "destructive",
      });
    },
  });

  // Update checklist item mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async (checklist: { title: string; completed: boolean }[]) => {
      return apiRequest("PUT", `/api/projects/${projectId}`, {
        checklist,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Checklist atualizada",
        description: "A checklist foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a checklist.",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/projects/${projectId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso.",
      });
      // Navigate back to projects page
      window.location.href = "/projects";
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateChecklistItem = (index: number, completed: boolean) => {
    if (!project || !project.checklist) return;
    
    const newChecklist = [...project.checklist];
    newChecklist[index].completed = completed;
    updateChecklistMutation.mutate(newChecklist);
  };

  const handleAddUpdate = () => {
    if (newUpdate.trim()) {
      addUpdateMutation.mutate(newUpdate);
    }
  };

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
  };

  const getResponsibleName = (responsibleId?: number | null) => {
    if (!responsibleId || !users) return "Não atribuído";
    const user = users.find((u) => u.id === responsibleId);
    return user ? user.name : "Não atribuído";
  };

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <p className="text-muted-foreground mt-2">O projeto solicitado não existe ou foi removido.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className={`${STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]?.bg} ${STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]?.text}`}
              >
                {project.status}
              </Badge>
              {project.municipality && (
                <span className="text-sm text-muted-foreground">{project.municipality}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditProject(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <Button variant="default" size="sm" onClick={() => setShowCreateSubproject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Subprojeto
            </Button>
          </div>
        </div>

        {/* Project Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 md:w-[500px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="subprojects">Subprojetos</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Project Details */}
              <div className="space-y-6 md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                        <p>{project.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Início</h3>
                        <p>{formatDate(project.startDate) || "Não definida"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Término</h3>
                        <p>{formatDate(project.endDate) || "Não definida"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Responsável</h3>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 bg-primary">
                            <AvatarFallback>{getInitials(getResponsibleName(project.responsibleId))}</AvatarFallback>
                          </Avatar>
                          <span>{getResponsibleName(project.responsibleId)}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">SLA</h3>
                        <p>{project.sla ? `${project.sla} dias` : "Não definido"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Status atualizado em</h3>
                        <p>{formatDateTime(project.statusUpdatedAt)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Última atualização</h3>
                        <p>{formatDateTime(project.updatedAt)}</p>
                      </div>
                    </div>

                    {/* Attachments section */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Anexos</h3>
                      {attachments && attachments.length > 0 ? (
                        <div className="space-y-2">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center">
                              <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                              <span className="text-sm">{attachment.filename} ({Math.round(attachment.fileSize! / 1024)} KB)</span>
                              <Button variant="ghost" size="sm" className="ml-auto p-1 h-auto">
                                <span className="material-icons text-gray-500 text-sm">download</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum anexo disponível</p>
                      )}
                      
                      <Button variant="outline" size="sm" className="mt-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Anexo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Updates */}
                <Card>
                  <CardHeader>
                    <CardTitle>Atualizações Diárias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      {updates && updates.length > 0 ? (
                        updates.map((update) => (
                          <div key={update.id} className="flex gap-4 pb-4 border-b border-gray-100">
                            <Avatar className="h-10 w-10 bg-primary">
                              <AvatarFallback>{getInitials(getResponsibleName(update.userId))}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{getResponsibleName(update.userId)}</span>
                                <span className="text-muted-foreground text-sm">{formatDateTime(update.createdAt)}</span>
                              </div>
                              <p className="mt-1">{update.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Nenhuma atualização registrada.</p>
                      )}
                    </div>

                    <div className="pt-4">
                      <Textarea
                        placeholder="Adicione uma atualização diária..."
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        rows={3}
                      />
                      <Button 
                        className="mt-2" 
                        onClick={handleAddUpdate} 
                        disabled={newUpdate.trim() === "" || addUpdateMutation.isPending}
                      >
                        {addUpdateMutation.isPending ? (
                          <span className="animate-spin mr-2">⭘</span>
                        ) : null}
                        Adicionar Atualização
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Checklist and Contacts */}
              <div className="space-y-6">
                {/* Checklist */}
                <Card>
                  <CardHeader>
                    <CardTitle>Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.checklist && project.checklist.length > 0 ? (
                      <div className="space-y-2">
                        {project.checklist.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Checkbox
                              id={`checklist-${index}`}
                              checked={item.completed}
                              onCheckedChange={(checked) => handleUpdateChecklistItem(index, !!checked)}
                            />
                            <label
                              htmlFor={`checklist-${index}`}
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                item.completed ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {item.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum item na checklist.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Contacts */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Contatos</CardTitle>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {contacts && contacts.length > 0 ? (
                      <div className="space-y-4">
                        {contacts.map((contact) => (
                          <div key={contact.id} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-secondary">
                              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{contact.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {contact.role || "Sem cargo"}
                              </div>
                              {contact.email && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {contact.email}
                                </div>
                              )}
                              {contact.phone && (
                                <div className="text-xs text-muted-foreground">
                                  {contact.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Subprojects Tab */}
          <TabsContent value="subprojects">
            <SubprojectList 
              projectId={projectId} 
              onCreateSubproject={() => setShowCreateSubproject(true)} 
            />
          </TabsContent>

          {/* Kanban Tab */}
          <TabsContent value="kanban">
            <KanbanView projectId={projectId} />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <CalendarView projectId={projectId} />
          </TabsContent>

          {/* Gantt Tab */}
          <TabsContent value="gantt">
            <GanttView projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          <ProjectForm 
            // Convertemos e adaptamos o formato do projeto para o formulário
            initialValues={{
              name: project.name,
              description: project.description,
              status: project.status,
              municipality: project.municipality,
              startDate: project.startDate ? new Date(project.startDate) : undefined,
              endDate: project.endDate ? new Date(project.endDate) : undefined,
              responsibleId: project.responsibleId,
              sla: project.sla ? project.sla : undefined,
              checklist: project.checklist
            }}
            onSuccess={() => setShowEditProject(false)} 
            onCancel={() => setShowEditProject(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Create Subproject Dialog */}
      <Dialog open={showCreateSubproject} onOpenChange={setShowCreateSubproject}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Subprojeto</DialogTitle>
          </DialogHeader>
          <SubprojectForm 
            projectId={projectId}
            onSuccess={() => setShowCreateSubproject(false)} 
            onCancel={() => setShowCreateSubproject(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Essa ação não pode ser desfeita e todos os subprojetos e atividades relacionados também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjectMutation.isPending ? (
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
