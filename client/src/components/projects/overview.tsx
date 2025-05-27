import { Project } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Plus, Upload } from "lucide-react";
import { formatDate, formatDateTime, getInitials, getResponsibleName } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

interface OverviewProps {
  project: Project;
}

export function Overview({ project }: OverviewProps) {
  const [newUpdate, setNewUpdate] = useState("");
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const queryClient = useQueryClient();

  // Buscar anexos
  const { data: attachments } = useQuery({
    queryKey: [`/api/projects/${project.id}/attachments`],
  });

  // Buscar atualizações
  const { data: updates } = useQuery({
    queryKey: [`/api/projects/${project.id}/updates`],
  });

  // Buscar contatos
  const { data: contacts } = useQuery({
    queryKey: [`/api/projects/${project.id}/contacts`],
  });

  // Mutação para adicionar atualização
  const addUpdateMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/projects/${project.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/updates`] });
      setNewUpdate("");
    },
  });

  // Mutação para atualizar checklist
  const updateChecklistMutation = useMutation({
    mutationFn: async (checklist: { title: string; completed: boolean }[]) => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update checklist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
    },
  });

  const handleAddUpdate = () => {
    if (newUpdate.trim()) {
      addUpdateMutation.mutate(newUpdate);
    }
  };

  const handleUpdateChecklistItem = (index: number, completed: boolean) => {
    const newChecklist = [...(project.checklist || [])];
    newChecklist[index] = { ...newChecklist[index], completed };
    updateChecklistMutation.mutate(newChecklist);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Coluna Esquerda - Detalhes do Projeto */}
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

            {/* Seção de anexos */}
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
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowAddAttachment(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Anexo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Atualizações Diárias */}
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

      {/* Coluna Direita - Checklist e Contatos */}
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

        {/* Contatos */}
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
  );
} 