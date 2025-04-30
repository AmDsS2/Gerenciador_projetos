import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Folder, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateRelative, getInitials } from "@/lib/utils";
import { Project, ProjectUpdate, User, Event, Activity } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { STATUS_COLORS } from "@/lib/constants";
import { addDays, format, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("lista");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Define type for dashboard stats
  interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    delayedProjects: number;
    completedProjects: number;
  }

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    // Provide default empty data to prevent type errors
    placeholderData: {
      totalProjects: 0,
      activeProjects: 0,
      delayedProjects: 0,
      completedProjects: 0
    }
  });

  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch recent activities (updates)
  const { data: recentUpdates } = useQuery<ProjectUpdate[]>({
    queryKey: ["/api/project-updates"],
  });
  
  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch upcoming events
  const { data: upcomingEvents } = useQuery<Event[]>({
    queryKey: ["/api/events", {
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), 30).toISOString()
    }],
    queryFn: async () => {
      const start = new Date();
      const end = addDays(start, 30);
      const response = await fetch(`/api/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    }
  });
  
  // Fetch overdue activities
  const { data: overdueActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities/delayed"],
    queryFn: async () => {
      const response = await fetch("/api/activities?status=Atrasado", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch delayed activities");
      return response.json();
    }
  });

  const getUserName = (userId?: number | null) => {
    if (!userId || !users) return "Não atribuído";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Não atribuído";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          
          <Link href="/projects">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total de Projetos"
          value={stats?.totalProjects || 0}
          icon={<Folder className="h-5 w-5 text-primary" />}
          trend={{
            value: 12,
            label: "desde o mês passado",
            positive: true
          }}
        />
        
        <DashboardCard
          title="Em Andamento"
          value={stats?.activeProjects || 0}
          icon={<Clock className="h-5 w-5 text-warning" />}
          trend={{
            value: 5,
            label: "desde o mês passado",
            positive: true
          }}
        />
        
        <DashboardCard
          title="Atrasados"
          value={stats?.delayedProjects || 0}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          trend={{
            value: 3,
            label: "desde o mês passado",
            positive: false
          }}
        />
        
        <DashboardCard
          title="Concluídos"
          value={stats?.completedProjects || 0}
          icon={<CheckCircle className="h-5 w-5 text-success" />}
          trend={{
            value: 18,
            label: "desde o mês passado",
            positive: true
          }}
        />
      </div>
      
      {/* Project List */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <h2 className="font-medium text-lg">Projetos</h2>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="lista" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="lista">Lista</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="calendario">Calendário</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lista" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Projeto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Município</TableHead>
                      <TableHead>Data de Início</TableHead>
                      <TableHead>Data de Término</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects && projects.length > 0 ? (
                      projects.slice(0, 5).map((project) => (
                        <TableRow key={project.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                <div className="text-sm text-gray-500">
                                  {project.description?.substring(0, 40)}
                                  {project.description && project.description.length > 40 ? "..." : ""}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]?.bg
                              } ${
                                STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]?.text
                              }`}
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2 bg-primary">
                                <AvatarFallback>
                                  {getInitials(getUserName(project.responsibleId))}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium text-gray-900">
                                {getUserName(project.responsibleId)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{project.municipality || "-"}</TableCell>
                          <TableCell>{formatDate(project.startDate)}</TableCell>
                          <TableCell>{formatDate(project.endDate)}</TableCell>
                          <TableCell>
                            {project.isDelayed ? (
                              <span className="flex items-center text-destructive">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Atrasado
                              </span>
                            ) : (
                              <span className="flex items-center text-success">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Em dia
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/projects/${project.id}`}>
                              <Button variant="link" className="text-primary">
                                Detalhes
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6">
                          Nenhum projeto encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between p-4 border-t border-gray-200 mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando <span className="font-medium">1</span> a{" "}
                  <span className="font-medium">{projects?.length || 0}</span> de{" "}
                  <span className="font-medium">{projects?.length || 0}</span> resultados
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Próximo
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="kanban" className="mt-4">
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground">Visualização Kanban disponível na página de projetos</p>
                  <Link href="/projects">
                    <Button variant="outline" className="mt-2">
                      Ver Projetos
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="calendario" className="mt-4">
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground">Visualização de Calendário disponível na página de calendário</p>
                  <Link href="/calendar">
                    <Button variant="outline" className="mt-2">
                      Ver Calendário
                    </Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="gantt" className="mt-4">
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground">Visualização Gantt em breve</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Activities and Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentUpdates && recentUpdates.length > 0 ? (
                recentUpdates.slice(0, 3).map((update) => (
                  <div key={update.id} className="flex gap-4">
                    <Avatar className="h-10 w-10 bg-primary">
                      <AvatarFallback>
                        {getInitials(getUserName(update.userId))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getUserName(update.userId)}</span>
                        <span className="text-gray-500">atualizou</span>
                        <Link href={`/projects/${update.projectId}`}>
                          <span className="font-medium hover:underline cursor-pointer">
                            {projects?.find(p => p.id === update.projectId)?.name || `Projeto #${update.projectId}`}
                          </span>
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDateRelative(update.createdAt)}
                      </div>
                      <p className="mt-1 text-sm">{update.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhuma atividade recente
                </div>
              )}
              
              {recentUpdates && recentUpdates.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Button variant="link" className="text-primary">
                    Ver mais atividades
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Calendar */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Calendário</CardTitle>
              <div className="flex items-center">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="mx-2 text-sm font-medium">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="text-xs font-medium text-gray-500">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2 text-center">
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate();
                  const hasEvent = upcomingEvents?.some(event => {
                    const eventDate = new Date(event.startDate);
                    return eventDate.getDate() === day && 
                           eventDate.getMonth() === currentMonth.getMonth() &&
                           eventDate.getFullYear() === currentMonth.getFullYear();
                  });
                  
                  return (
                    <div 
                      key={i} 
                      className={`h-10 flex items-center justify-center text-sm cursor-pointer rounded-full
                        ${isToday ? "bg-gray-100 font-semibold border border-gray-300" : ""}
                        ${hasEvent ? "bg-primary-light/20 text-primary font-medium" : ""}
                      `}
                    >
                      {day <= 31 ? day : ""}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm mb-2">Próximos Eventos</h4>
                
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id} 
                      className="p-2 text-sm rounded-lg border-l-4 border-l-primary bg-primary-light/10 flex items-center"
                    >
                      <span className="material-icons text-primary mr-2 text-sm">event</span>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(event.startDate)}
                          {event.location && ` - ${event.location}`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Nenhum evento próximo
                  </div>
                )}
                
                {upcomingEvents && upcomingEvents.length > 0 && (
                  <div className="pt-2">
                    <Link href="/calendar">
                      <Button variant="link" size="sm" className="text-primary p-0">
                        Ver calendário completo
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
