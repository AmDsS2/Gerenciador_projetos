import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event, Project } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MONTHS, WEEKDAYS_SHORT } from "@/lib/constants";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EventForm } from "@/components/events/event-form";

interface CalendarViewProps {
  projectId?: number;  // Optional to allow viewing all events
}

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  projectId?: number;
  subprojectId?: number;
  type: "event" | "activity" | "deadline";
  color: string;
}

export function CalendarView({ projectId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Calculate dates for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: ptBR });
  const endDate = endOfWeek(monthEnd, { locale: ptBR });

  // Fetch events
  const { data: eventsData, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", {
      projectId,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (projectId) queryParams.append("projectId", projectId.toString());
      queryParams.append("startDate", format(startDate, 'yyyy-MM-dd'));
      queryParams.append("endDate", format(endDate, 'yyyy-MM-dd'));
      
      const response = await fetch(`/api/events?${queryParams.toString()}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnWindowFocus: true, // Recarregar quando a janela receber foco
  });

  // If projectId is provided, fetch project information
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId
  });

  // Transform API events into calendar events
  useEffect(() => {
    if (eventsData) {
      console.log("Eventos recebidos:", eventsData);
      const transformedEvents: CalendarEvent[] = eventsData.map(event => {
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : undefined;
        
        console.log("Transformando evento:", {
          id: event.id,
          title: event.title,
          startDate,
          endDate
        });

        return {
          id: event.id,
          title: event.title,
          description: event.description || undefined,
          startDate,
          endDate,
          location: event.location || undefined,
          projectId: event.projectId || undefined,
          subprojectId: event.subprojectId || undefined,
          type: "event",
          color: "bg-primary-light/20 text-primary"
        };
      });
      
      console.log("Eventos transformados:", transformedEvents);
      setEvents(transformedEvents);
    }
  }, [eventsData]);

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (day: Date) => {
    // Here you could implement logic to show events for the selected day
    // or open a dialog to add a new event on the selected day
    console.log("Selected day:", day);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  // Calculate calendar cells
  const renderCalendarCells = () => {
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Create the rows for the calendar
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Filtrar eventos para o dia atual
        const dayEvents = events.filter(event => {
          const eventDate = new Date(event.startDate);
          const isSameDay = eventDate.getDate() === cloneDay.getDate() &&
                           eventDate.getMonth() === cloneDay.getMonth() &&
                           eventDate.getFullYear() === cloneDay.getFullYear();
          
          console.log("Verificando evento:", {
            eventDate,
            cloneDay,
            isSameDay
          });
          
          return isSameDay;
        });

        days.push(
          <div
            key={day.toString()}
            className={`h-24 border border-gray-200 p-1 overflow-hidden ${
              !isSameMonth(day, monthStart) ? "bg-gray-100 text-gray-400" : ""
            } ${isSameDay(day, new Date()) ? "bg-gray-100 font-semibold border-primary" : ""}`}
            onClick={() => handleDateClick(cloneDay)}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm">{formattedDate}</span>
              {dayEvents.length > 0 && (
                <span className="text-xs text-gray-500">{dayEvents.length} evento(s)</span>
              )}
            </div>
            <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
              {dayEvents.map((event, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-1 rounded-sm truncate cursor-pointer ${event.color}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-px">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>
          {projectId && project ? `Calendário: ${project.name}` : "Calendário"}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-medium">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowAddEvent(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px mb-2">
          {WEEKDAYS_SHORT.map((weekday) => (
            <div
              key={weekday}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {weekday}
            </div>
          ))}
        </div>
        {eventsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-px">{renderCalendarCells()}</div>
        )}
      </CardContent>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Data</p>
                  <div className="flex items-center mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    <p>{formatDate(selectedEvent.startDate)}</p>
                  </div>
                  {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && (
                    <div className="flex items-center mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      <p>Até {formatDate(selectedEvent.endDate)}</p>
                    </div>
                  )}
                </div>
                {selectedEvent.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Local</p>
                    <p className="mt-1">{selectedEvent.location}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowEventDetails(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <EventForm
            projectId={projectId}
            onSuccess={() => setShowAddEvent(false)}
            onCancel={() => setShowAddEvent(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
