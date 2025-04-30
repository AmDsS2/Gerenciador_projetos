import { useState } from "react";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectForm } from "@/components/projects/project-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Projects() {
  const [showCreateProject, setShowCreateProject] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Projetos</h1>
      </div>

      <ProjectList onCreateProject={() => setShowCreateProject(true)} />

      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>
              Preencha as informações abaixo para criar um novo projeto.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm 
            onSuccess={() => setShowCreateProject(false)} 
            onCancel={() => setShowCreateProject(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
