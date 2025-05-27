/**
 * Componente de visualização Gantt para projetos e atividades
 * 
 * Este componente oferece uma visualização de cronograma no formato Gantt,
 * permitindo visualizar o progresso de atividades e subprojetos ao longo do tempo.
 * As barras são coloridas de acordo com o status do item e são posicionadas
 * proporcionalmente no intervalo de tempo do projeto.
 */

import { useQuery } from "@tanstack/react-query";
import { format, addDays, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Project, Subproject, Activity } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { STATUS_COLORS } from "@/lib/constants";

interface GanttViewProps {
  projectId: number;
}

export function GanttView({ projectId }: GanttViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Buscar projeto
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });

  // Buscar subprojetos
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: [`/api/projects/${projectId}/subprojects`],
  });

  // Buscar atividades
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const res = await fetch(`/api/activities?projectId=${projectId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  // Calcular datas para o gráfico
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(addDays(currentMonth, 30));
  const totalDays = differenceInDays(endDate, startDate) + 1;

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

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => addDays(prev, -30));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addDays(prev, 30));
  };

  if (!project) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Gráfico Gantt</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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

            {/* Projeto */}
            <div className="border-b">
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

              {/* Subprojetos */}
              {subprojects?.map(subproject => (
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

              {/* Atividades */}
              {activities?.map(activity => (
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
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}