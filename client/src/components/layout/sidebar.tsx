import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Folder, LayoutDashboard, Calendar, Subtitles, CheckSquare, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";

interface SidebarProps {
  user: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
  };
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();

  const { data: recentProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60, // 1 minute
  });

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/",
    },
    {
      name: "Projetos",
      icon: <Folder className="h-5 w-5" />,
      href: "/projects",
    },
    {
      name: "Subprojetos",
      icon: <Subtitles className="h-5 w-5" />,
      href: "/subprojects",
    },
    {
      name: "Atividades",
      icon: <CheckSquare className="h-5 w-5" />,
      href: "/activities",
    },
    {
      name: "Calendário",
      icon: <Calendar className="h-5 w-5" />,
      href: "/calendar",
    },
  ];

  // Admin-only menu items
  if (user.role === "admin") {
    menuItems.push({
      name: "Usuários",
      icon: <Users className="h-5 w-5" />,
      href: "/users",
    });
  }

  return (
    <div className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 h-screen">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <h1 className="text-lg font-semibold text-primary">RP Projects</h1>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="mb-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-100",
                location === item.href && "bg-primary-light/10 text-primary"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        {recentProjects && recentProjects.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
              Projetos Recentes
            </h3>
            {recentProjects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="px-3 py-2 text-sm truncate hover:bg-gray-100 rounded cursor-pointer block"
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      project.status === "Em andamento" && "bg-success",
                      project.status === "Aguardando" && "bg-warning",
                      project.status === "Finalizado" && "bg-secondary",
                      project.status === "Atrasado" && "bg-destructive"
                    )}
                  />
                  <span className="truncate">{project.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="font-semibold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-gray-500">
              {user.role === "admin"
                ? "Administrador"
                : user.role === "manager"
                ? "Gerente"
                : "Usuário"}
            </div>
          </div>
          <button
            className="ml-auto p-1 rounded-full hover:bg-gray-100"
            onClick={onLogout}
          >
            <span className="material-icons text-gray-500">logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
