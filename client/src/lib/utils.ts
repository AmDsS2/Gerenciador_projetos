import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatDateRelative(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  
  if (isSameDay(dateObj, today)) {
    return `Hoje, ${format(dateObj, "HH:mm")}`;
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(dateObj, yesterday)) {
    return `Ontem, ${format(dateObj, "HH:mm")}`;
  }
  
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
}

export function getStatusColor(status: string) {
  switch (status) {
    case "Em andamento":
      return "success";
    case "Aguardando":
      return "warning";
    case "Finalizado":
      return "secondary";
    case "Atrasado":
      return "destructive";
    default:
      return "primary";
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getRandomColor(): string {
  const colors = [
    "bg-red-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}
