import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subproject, Project } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubprojectList } from "@/components/subprojects/subproject-list";
import { SubprojectForm } from "@/components/subprojects/subproject-form";
import { Filter, Plus } from "lucide-react";

export default function Subprojects() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showCreateSubproject, setShowCreateSubproject] = useState(false);
  
  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Display all subprojects if no project is selected
  const handleCreateSubproject = () => {
    setShowCreateSubproject(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Subprojetos</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedProject?.toString() || ""} onValueChange={(value) => setSelectedProject(value ? parseInt(value) : null)}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por projeto" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os projetos</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleCreateSubproject}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Subprojeto
          </Button>
        </div>
      </div>

      {selectedProject ? (
        <SubprojectList
          projectId={selectedProject}
          onCreateSubproject={handleCreateSubproject}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subprojetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">Selecione um projeto</h3>
              <p className="text-muted-foreground mb-4">
                Escolha um projeto para visualizar seus subprojetos ou crie um novo subprojeto.
              </p>
              <Button onClick={handleCreateSubproject}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Subprojeto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateSubproject} onOpenChange={setShowCreateSubproject}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Subprojeto</DialogTitle>
          </DialogHeader>
          <SubprojectForm 
            projectId={selectedProject || (projects?.[0]?.id || 0)}
            onSuccess={() => setShowCreateSubproject(false)} 
            onCancel={() => setShowCreateSubproject(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
