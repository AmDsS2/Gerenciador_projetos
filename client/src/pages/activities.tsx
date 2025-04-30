import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subproject, Project } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityList } from "@/components/activities/activity-list";
import { ActivityForm } from "@/components/activities/activity-form";
import { Filter, Plus } from "lucide-react";

export default function Activities() {
  const [selectedSubproject, setSelectedSubproject] = useState<number | null>(null);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(true);
  
  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch subprojects
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: ["/api/subprojects"],
  });

  const handleCreateActivity = () => {
    setShowCreateActivity(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Atividades</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select 
            value={selectedSubproject?.toString() || ""} 
            onValueChange={(value) => {
              setSelectedSubproject(value ? parseInt(value) : null);
              setShowAllActivities(!value);
            }}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por subprojeto" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as atividades</SelectItem>
              {subprojects?.map((subproject) => (
                <SelectItem key={subproject.id} value={subproject.id.toString()}>
                  {subproject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleCreateActivity} disabled={!selectedSubproject && subprojects?.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>
      </div>

      {showAllActivities ? (
        <ActivityList 
          showAll 
          onCreateActivity={handleCreateActivity}
        />
      ) : selectedSubproject ? (
        <ActivityList 
          subprojectId={selectedSubproject} 
          onCreateActivity={handleCreateActivity}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">Selecione um subprojeto</h3>
              <p className="text-muted-foreground mb-4">
                Escolha um subprojeto para visualizar suas atividades ou crie uma nova atividade.
              </p>
              {subprojects && subprojects.length > 0 ? (
                <Button onClick={handleCreateActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Atividade
                </Button>
              ) : (
                <div className="text-yellow-600 mt-4">
                  Não há subprojetos cadastrados. Crie um subprojeto primeiro para adicionar atividades.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Activity Dialog */}
      {(selectedSubproject || (subprojects && subprojects.length > 0)) && (
        <Dialog open={showCreateActivity} onOpenChange={setShowCreateActivity}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Nova Atividade</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para criar uma nova atividade no subprojeto.
              </DialogDescription>
            </DialogHeader>
            <ActivityForm 
              subprojectId={selectedSubproject || (subprojects?.[0]?.id || 0)}
              onSuccess={() => setShowCreateActivity(false)} 
              onCancel={() => setShowCreateActivity(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
