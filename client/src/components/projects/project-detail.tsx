import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Project, Subproject, ProjectUpdate, Contact, User, Attachment } from "@shared/types";
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
import { ContactForm } from "@/components/contacts/contact-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2, Upload, Calendar, CheckSquare, ClipboardList, Plus, FileText } from "lucide-react";
import { ProjectForm } from "./project-form";
import { AttachmentForm } from "@/components/attachments/attachment-form";
import { STATUS_COLORS } from "@/lib/constants";
import { Overview } from "./overview";
import { SubprojectsList } from "./subprojects-list";
import { KanbanBoard } from "../kanban/kanban-board";

interface ProjectDetailProps {
  projectId: number;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditProject, setShowEditProject] = useState(false);
  const [showCreateSubproject, setShowCreateSubproject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="subprojects">Subprojetos</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Overview project={project} />
            </TabsContent>
            <TabsContent value="subprojects">
              <SubprojectsList projectId={projectId} />
            </TabsContent>
            <TabsContent value="kanban">
              <KanbanBoard projectId={projectId} />
            </TabsContent>
            <TabsContent value="calendar">
              <CalendarView projectId={projectId} />
            </TabsContent>
            <TabsContent value="gantt">
              <GanttView projectId={projectId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
      
      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Contato</DialogTitle>
          </DialogHeader>
          <ContactForm
            projectId={projectId}
            onSuccess={() => setShowAddContact(false)}
            onCancel={() => setShowAddContact(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Add Attachment Dialog */}
      <Dialog open={showAddAttachment} onOpenChange={setShowAddAttachment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Anexo</DialogTitle>
          </DialogHeader>
          <AttachmentForm
            entityType="project"
            entityId={projectId}
            onSuccess={() => setShowAddAttachment(false)}
            onCancel={() => setShowAddAttachment(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
