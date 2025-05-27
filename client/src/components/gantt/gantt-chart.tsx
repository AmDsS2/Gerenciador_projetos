import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Project, Subproject, Activity } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface GanttChartProps {
  projectId?: number;
}

export function GanttChart({ projectId }: GanttChartProps) {
  // Buscar projetos
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Buscar subprojetos
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: ["/api/subprojects"],
  });

  // Buscar atividades
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Calcular datas para o gráfico
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(addDays(new Date(), 30));
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Filtrar itens baseado no projectId
  const filteredProjects = projectId 
    ? projects?.filter(p => p.id === projectId)
    : projects;

  const filteredSubprojects = projectId
    ? subprojects?.filter(s => s.projectId === projectId)
    : subprojects;

  const filteredActivities = projectId
    ? activities?.filter(a => {
        const subproject = subprojects?.find(s => s.id === a.subprojectId);
        return subproject?.projectId === projectId;
      })
    : activities;

  // Renderizar cabeçalho com datas
  const renderDateHeader = () => {
    const dates = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      dates.push(
        <div 
          key={i} 
          className="min-w-[100px] text-center text-sm border-r border-gray-200 py-2"
        >
          {format(date, "dd/MM", { locale: ptBR })}
        </div>
      );
    }
    return dates;
  };

  // Renderizar barra do Gantt
  const renderGanttBar = (item: Project | Subproject | Activity) => {
    const start = new Date(item.startDate || "");
    const end = new Date(item.endDate || "");
    
    const startOffset = differenceInDays(start, startDate);
    const duration = differenceInDays(end, start) + 1;
    
    const isDelayed = "isDelayed" in item ? item.isDelayed : false;
    const status = "status" in item ? item.status : "Em andamento";

    return (
      <div 
        className="relative h-8"
        style={{
          marginLeft: `${startOffset * 100}px`,
          width: `${duration * 100}px`,
        }}
      >
        <div 
          className={`absolute inset-0 rounded-md ${
            isDelayed 
              ? "bg-destructive/20 border border-destructive" 
              : STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.bg || "bg-primary/20"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium truncate px-2">
            {item.name}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gráfico Gantt</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="min-w-full">
            {/* Cabeçalho com datas */}
            <div className="flex sticky top-0 bg-white z-10 border-b">
              <div className="w-[200px] p-2 font-medium border-r">Item</div>
              <div className="flex">
                {renderDateHeader()}
              </div>
            </div>

            {/* Projetos */}
            {filteredProjects?.map(project => (
              <div key={project.id} className="border-b">
                <div className="flex">
                  <div className="w-[200px] p-2 border-r">
                    <div className="font-medium">{project.name}</div>
                    <Badge variant="outline" className="mt-1">
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex-1 relative">
                    {renderGanttBar(project)}
                  </div>
                </div>

                {/* Subprojetos do projeto */}
                {filteredSubprojects
                  ?.filter(sub => sub.projectId === project.id)
                  .map(subproject => (
                    <div key={subproject.id} className="flex pl-8 border-b">
                      <div className="w-[200px] p-2 border-r">
                        <div className="font-medium">{subproject.name}</div>
                        <Badge variant="outline" className="mt-1">
                          {subproject.status}
                        </Badge>
                      </div>
                      <div className="flex-1 relative">
                        {renderGanttBar(subproject)}
                      </div>
                    </div>
                  ))}

                {/* Atividades dos subprojetos */}
                {filteredActivities
                  ?.filter(activity => {
                    const subproject = filteredSubprojects?.find(
                      sub => sub.id === activity.subprojectId
                    );
                    return subproject?.projectId === project.id;
                  })
                  .map(activity => (
                    <div key={activity.id} className="flex pl-16 border-b">
                      <div className="w-[200px] p-2 border-r">
                        <div className="font-medium">{activity.name}</div>
                        <Badge variant="outline" className="mt-1">
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex-1 relative">
                        {renderGanttBar(activity)}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 