import { useQuery } from "@tanstack/react-query";
import { Subproject } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

interface SubprojectsListProps {
  projectId: number;
}

export function SubprojectsList({ projectId }: SubprojectsListProps) {
  const { data: subprojects } = useQuery<Subproject[]>({
    queryKey: [`/api/projects/${projectId}/subprojects`],
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Subprojetos</CardTitle>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Subprojeto
        </Button>
      </CardHeader>
      <CardContent>
        {subprojects && subprojects.length > 0 ? (
          <div className="space-y-4">
            {subprojects.map((subproject) => (
              <div key={subproject.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{subproject.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {subproject.description}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {subproject.status}
                    </Badge>
                    {subproject.startDate && (
                      <span className="text-sm text-muted-foreground">
                        Início: {formatDate(subproject.startDate)}
                      </span>
                    )}
                    {subproject.endDate && (
                      <span className="text-sm text-muted-foreground">
                        Término: {formatDate(subproject.endDate)}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Ver detalhes
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Nenhum subprojeto cadastrado.
          </p>
        )}
      </CardContent>
    </Card>
  );
} 