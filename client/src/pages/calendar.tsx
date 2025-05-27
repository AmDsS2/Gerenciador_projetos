import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/types";
import { CalendarView } from "@/components/calendar/calendar-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Calendar() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  // Fetch projects
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Calendário</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select 
            value={selectedProject?.toString() || ""} 
            onValueChange={(value) => setSelectedProject(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filtrar por projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <CalendarView projectId={selectedProject || undefined} />
      )}
    </div>
  );
}
