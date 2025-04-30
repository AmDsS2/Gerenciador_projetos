/**
 * Componente de visualização Gantt para projetos e atividades
 * 
 * Este componente oferece uma visualização de cronograma no formato Gantt,
 * permitindo visualizar o progresso de atividades e subprojetos ao longo do tempo.
 * As barras são coloridas de acordo com o status do item e são posicionadas
 * proporcionalmente no intervalo de tempo do projeto.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Subproject } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

interface GanttViewProps {
  projectId?: number;
  subprojectId?: number;
}

export function GanttView({ projectId, subprojectId }: GanttViewProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subprojects, setSubprojects] = useState<Subproject[]>([]);
  const [timeRange, setTimeRange] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar subprojetos se o projectId for fornecido
  const { data: projectSubprojects, isLoading: isSubprojectsLoading } = useQuery<Subproject[]>({
    queryKey: [`/api/projects/${projectId}/subprojects`],
    enabled: !!projectId,
  });

  // Buscar atividades com base no subprojectId
  const { data: subprojectActivities, isLoading: isActivitiesLoading } = useQuery<Activity[]>({
    queryKey: [`/api/subprojects/${subprojectId}/activities`],
    enabled: !!subprojectId,
  });

  // Calcular o intervalo de tempo para o gráfico de Gantt
  useEffect(() => {
    if (projectSubprojects?.length && !subprojectId) {
      setSubprojects(projectSubprojects);
    }

    if (subprojectActivities?.length) {
      setActivities(subprojectActivities);
    }

    // Calcular datas mínima e máxima
    const allItems = [...(activities || [])];
    
    if (allItems.length > 0) {
      const dates = allItems.flatMap(item => [
        item.startDate ? new Date(item.startDate) : null,
        item.dueDate ? new Date(item.dueDate) : null
      ]).filter((date): date is Date => date !== null);
      
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        // Adicionar margem de 7 dias antes e depois
        minDate.setDate(minDate.getDate() - 7);
        maxDate.setDate(maxDate.getDate() + 7);
        
        setTimeRange([minDate, maxDate]);
      }
    }
    
    setLoading(false);
  }, [projectSubprojects, subprojectActivities, projectId, subprojectId]);

  // Gerar as datas para o cabeçalho
  const generateDateHeaders = () => {
    if (timeRange.length !== 2) return [];
    
    const [start, end] = timeRange;
    const dateHeaders = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dateHeaders.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateHeaders;
  };

  const dateHeaders = generateDateHeaders();

  // Calcular a posição e largura de cada barra no gráfico
  const calculateBarPosition = (startDate: Date | string | null, endDate: Date | string | null) => {
    if (!startDate || !endDate || timeRange.length !== 2) return { left: 0, width: 0 };
    
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const [rangeStart, rangeEnd] = timeRange;
    
    const totalDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const startDays = Math.max(0, Math.round((start.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    const left = (startDays / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left, width };
  };

  if (isSubprojectsLoading || isActivitiesLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visualização Gantt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dateHeaders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visualização Gantt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              Sem dados suficientes para exibir o gráfico Gantt. Adicione atividades com datas de início e término.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualização Gantt</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Cabeçalho de datas */}
          <div className="flex border-b">
            <div className="w-1/4 min-w-[200px] p-2 font-medium">Tarefa</div>
            <div className="w-3/4 flex">
              {dateHeaders.map((date, i) => (
                <div 
                  key={i} 
                  className={`flex-1 text-center text-xs p-1 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-100' : ''}`}
                >
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Linhas de atividades */}
          {activities.map((activity) => (
            <div key={activity.id} className="flex border-b hover:bg-slate-50">
              <div className="w-1/4 min-w-[200px] p-2 truncate">
                {activity.name}
              </div>
              <div className="w-3/4 relative h-10">
                {activity.startDate && activity.dueDate && (
                  <div 
                    className="absolute top-2 bottom-2 rounded-md"
                    style={{
                      left: `${calculateBarPosition(activity.startDate, activity.dueDate).left}%`,
                      width: `${calculateBarPosition(activity.startDate, activity.dueDate).width}%`,
                      backgroundColor: STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS]?.bg || '#3b82f6',
                    }}
                  >
                    <div className="h-full w-full flex items-center justify-center text-xs text-white overflow-hidden">
                      {activity.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Se estamos visualizando um projeto, mostrar também os subprojetos */}
          {projectId && !subprojectId && subprojects.map((subproject) => (
            <div key={subproject.id} className="flex border-b hover:bg-slate-50">
              <div className="w-1/4 min-w-[200px] p-2 font-medium truncate">
                {subproject.name}
              </div>
              <div className="w-3/4 relative h-10">
                {subproject.startDate && subproject.endDate && (
                  <div 
                    className="absolute top-2 bottom-2 rounded-md"
                    style={{
                      left: `${calculateBarPosition(subproject.startDate, subproject.endDate).left}%`,
                      width: `${calculateBarPosition(subproject.startDate, subproject.endDate).width}%`,
                      backgroundColor: STATUS_COLORS[subproject.status as keyof typeof STATUS_COLORS]?.bg || '#4b5563',
                    }}
                  >
                    <div className="h-full w-full flex items-center justify-center text-xs text-white overflow-hidden">
                      {subproject.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {activities.length === 0 && (!subprojects || subprojects.length === 0) && (
            <div className="text-center py-5">
              <p className="text-muted-foreground">Sem atividades ou subprojetos para exibir.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}