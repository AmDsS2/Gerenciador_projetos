import { z } from "zod";

// User types
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  avatar: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

// Project types
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  statusUpdatedAt: z.string(),
  municipality: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  responsibleId: z.number().nullable(),
  sla: z.number().nullable(),
  isDelayed: z.boolean(),
  checklist: z.array(z.object({
    title: z.string(),
    completed: z.boolean(),
  })).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

// Contact types
export const contactSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  notes: z.string().nullable(),
  projectId: z.number(),
  createdAt: z.string(),
});

export type Contact = z.infer<typeof contactSchema>;

// Project update types
export const projectUpdateSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  content: z.string(),
  userId: z.number(),
  createdAt: z.string(),
});

export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

// Subproject types
export const subprojectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  statusUpdatedAt: z.string(),
  projectId: z.number(),
  responsibleId: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Subproject = z.infer<typeof subprojectSchema>;

// Activity types
export const activitySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  statusUpdatedAt: z.string(),
  subprojectId: z.number(),
  responsibleId: z.number().nullable(),
  startDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  sla: z.number().nullable(),
  isDelayed: z.boolean(),
  checklist: z.array(z.object({
    title: z.string(),
    completed: z.boolean(),
  })).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Activity = z.infer<typeof activitySchema>;

// Activity comment types
export const activityCommentSchema = z.object({
  id: z.number(),
  activityId: z.number(),
  content: z.string(),
  userId: z.number(),
  createdAt: z.string(),
});

export type ActivityComment = z.infer<typeof activityCommentSchema>;

// Attachment types
export const attachmentSchema = z.object({
  id: z.number(),
  filename: z.string(),
  path: z.string(),
  fileType: z.string().nullable(),
  fileSize: z.number().nullable(),
  projectId: z.number().nullable(),
  subprojectId: z.number().nullable(),
  activityId: z.number().nullable(),
  uploadedBy: z.number(),
  createdAt: z.string(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

// Event types
export const eventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().nullable(),
  projectId: z.number().nullable(),
  subprojectId: z.number().nullable(),
  createdBy: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

// Audit log types
export const auditLogSchema = z.object({
  id: z.number(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.number(),
  userId: z.number().nullable(),
  details: z.any().nullable(),
  createdAt: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>; 