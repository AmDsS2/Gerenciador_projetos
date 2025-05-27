import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

interface KanbanBoardProps {
  projectId: number;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
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

  const columns = [
    { id: "todo", title: "A Fazer" },
    { id: "in_progress", title: "Em Andamento" },
    { id: "done", title: "Concluído" },
  ];

  const getActivitiesByStatus = (status: string) => {
    return activities?.filter(activity => activity.status === status) || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quadro Kanban</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              <div className="font-medium text-sm text-muted-foreground">
                {column.title} ({getActivitiesByStatus(column.id).length})
              </div>
              <div className="space-y-2">
                {getActivitiesByStatus(column.id).map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="font-medium">{activity.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {activity.status}
                      </Badge>
                      {activity.dueDate && (
                        <span className="text-sm text-muted-foreground">
                          Prazo: {formatDate(activity.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 