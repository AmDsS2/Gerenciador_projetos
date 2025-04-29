export const PROJECT_STATUS_OPTIONS = [
  { label: "Em andamento", value: "Em andamento" },
  { label: "Aguardando", value: "Aguardando" },
  { label: "Finalizado", value: "Finalizado" },
  { label: "Atrasado", value: "Atrasado" },
];

export const USER_ROLES = [
  { label: "Administrador", value: "admin" },
  { label: "Gerente de Projeto", value: "manager" },
  { label: "Usuário", value: "user" },
];

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Color mappings for status
export const STATUS_COLORS = {
  "Em andamento": {
    bg: "bg-success-light/20",
    text: "text-success",
    border: "border-success-light",
  },
  "Aguardando": {
    bg: "bg-warning-light/20",
    text: "text-warning",
    border: "border-warning-light",
  },
  "Finalizado": {
    bg: "bg-secondary-light/20",
    text: "text-secondary",
    border: "border-secondary-light",
  },
  "Atrasado": {
    bg: "bg-destructive-light/20",
    text: "text-destructive",
    border: "border-destructive-light",
  },
};

// Default project checklist items
export const DEFAULT_PROJECT_CHECKLIST = [
  { title: "Documentação inicial", completed: false },
  { title: "Aprovação do escopo", completed: false },
  { title: "Análise de viabilidade", completed: false },
  { title: "Orçamento aprovado", completed: false },
  { title: "Equipe alocada", completed: false },
];

// SLA options (in days)
export const SLA_OPTIONS = [
  { label: "1 dia", value: 1 },
  { label: "2 dias", value: 2 },
  { label: "3 dias", value: 3 },
  { label: "5 dias", value: 5 },
  { label: "7 dias", value: 7 },
  { label: "10 dias", value: 10 },
  { label: "15 dias", value: 15 },
  { label: "30 dias", value: 30 },
];
