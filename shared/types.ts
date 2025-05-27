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

export const insertUserSchema = userSchema.omit({
  id: true,
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

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

export const insertProjectSchema = projectSchema.omit({
  id: true,
  statusUpdatedAt: true,
  isDelayed: true,
  createdAt: true,
  updatedAt: true,
});

export type Project = z.infer<typeof projectSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;

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

export const insertContactSchema = contactSchema.omit({
  id: true,
  createdAt: true,
});

export type Contact = z.infer<typeof contactSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Project update types
export const projectUpdateSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  content: z.string(),
  userId: z.number(),
  createdAt: z.string(),
});

export const insertProjectUpdateSchema = projectUpdateSchema.omit({
  id: true,
  createdAt: true,
});

export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;

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

export const insertSubprojectSchema = subprojectSchema.omit({
  id: true,
  statusUpdatedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type Subproject = z.infer<typeof subprojectSchema>;
export type InsertSubproject = z.infer<typeof insertSubprojectSchema>;

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

export const insertActivitySchema = activitySchema.omit({
  id: true,
  statusUpdatedAt: true,
  isDelayed: true,
  createdAt: true,
  updatedAt: true,
});

export type Activity = z.infer<typeof activitySchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Activity comment types
export const activityCommentSchema = z.object({
  id: z.number(),
  activityId: z.number(),
  content: z.string(),
  userId: z.number(),
  createdAt: z.string(),
});

export const insertActivityCommentSchema = activityCommentSchema.omit({
  id: true,
  createdAt: true,
});

export type ActivityComment = z.infer<typeof activityCommentSchema>;
export type InsertActivityComment = z.infer<typeof insertActivityCommentSchema>;

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

export const insertAttachmentSchema = attachmentSchema.omit({
  id: true,
  createdAt: true,
});

export type Attachment = z.infer<typeof attachmentSchema>;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

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

export const insertEventSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;

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

export const insertAuditLogSchema = auditLogSchema.omit({
  id: true,
  createdAt: true,
});

export type AuditLog = z.infer<typeof auditLogSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>; 