import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from './schema';
import {
  User, InsertUser,
  Project, InsertProject,
  Contact, InsertContact,
  ProjectUpdate, InsertProjectUpdate,
  Subproject, InsertSubproject,
  Activity, InsertActivity,
  ActivityComment, InsertActivityComment,
  Attachment, InsertAttachment,
  Event, InsertEvent,
  AuditLog, InsertAuditLog,
} from "@shared/types";

export type UpdateProject = Partial<InsertProject> & { isDelayed?: boolean };
export type UpdateActivity = Partial<InsertActivity> & { isDelayed?: boolean };

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  updateProject(id: number, project: UpdateProject): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  listProjects(): Promise<Project[]>;
  getProjectsByResponsible(userId: number): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  getProjectsByMunicipality(municipality: string): Promise<Project[]>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContactsByProject(projectId: number): Promise<Contact[]>;
  
  // Project updates operations
  createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate>;
  getProjectUpdatesByProject(projectId: number): Promise<ProjectUpdate[]>;
  getLatestProjectUpdate(projectId: number): Promise<ProjectUpdate | undefined>;
  
  // Subproject operations
  createSubproject(subproject: InsertSubproject): Promise<Subproject>;
  getSubproject(id: number): Promise<Subproject | undefined>;
  updateSubproject(id: number, subproject: Partial<InsertSubproject>): Promise<Subproject | undefined>;
  deleteSubproject(id: number): Promise<boolean>;
  getSubprojectsByProject(projectId: number): Promise<Subproject[]>;
  getSubprojectsByResponsible(userId: number): Promise<Subproject[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivity(id: number): Promise<Activity | undefined>;
  updateActivity(id: number, activity: UpdateActivity): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  getActivitiesBySubproject(subprojectId: number): Promise<Activity[]>;
  getActivitiesByResponsible(userId: number): Promise<Activity[]>;
  getDelayedActivities(): Promise<Activity[]>;
  
  // Activity comments operations
  createActivityComment(comment: InsertActivityComment): Promise<ActivityComment>;
  getActivityCommentsByActivity(activityId: number): Promise<ActivityComment[]>;
  
  // Attachment operations
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachmentsByEntity(entityType: string, entityId: number): Promise<Attachment[]>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getEventsByProject(projectId: number): Promise<Event[]>;
  getEventsBySubproject(subprojectId: number): Promise<Event[]>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  listEvents(): Promise<Event[]>;
  
  // Audit logs operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;
  
  // Dashboard operations
  getDashboardStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    delayedProjects: number;
    completedProjects: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private contacts: Map<number, Contact>;
  private projectUpdates: Map<number, ProjectUpdate>;
  private subprojects: Map<number, Subproject>;
  private activities: Map<number, Activity>;
  private activityComments: Map<number, ActivityComment>;
  private attachments: Map<number, Attachment>;
  private events: Map<number, Event>;
  private auditLogs: Map<number, AuditLog>;
  
  private currentUserId: number;
  private currentProjectId: number;
  private currentContactId: number;
  private currentProjectUpdateId: number;
  private currentSubprojectId: number;
  private currentActivityId: number;
  private currentActivityCommentId: number;
  private currentAttachmentId: number;
  private currentEventId: number;
  private currentAuditLogId: number;
  
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.contacts = new Map();
    this.projectUpdates = new Map();
    this.subprojects = new Map();
    this.activities = new Map();
    this.activityComments = new Map();
    this.attachments = new Map();
    this.events = new Map();
    this.auditLogs = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentContactId = 1;
    this.currentProjectUpdateId = 1;
    this.currentSubprojectId = 1;
    this.currentActivityId = 1;
    this.currentActivityCommentId = 1;
    this.currentAttachmentId = 1;
    this.currentEventId = 1;
    this.currentAuditLogId = 1;
    
    // Initialize with a default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id,
      statusUpdatedAt: now,
      isDelayed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async updateProject(id: number, project: UpdateProject): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    const now = new Date().toISOString();
    const updatedProject: Project = {
      ...existingProject,
      ...project,
      id: existingProject.id,
      createdAt: existingProject.createdAt,
      updatedAt: now,
    };
    if (project.status && project.status !== existingProject.status) {
      updatedProject.statusUpdatedAt = now;
    }
    if (typeof project.isDelayed === 'boolean') {
      updatedProject.isDelayed = project.isDelayed;
    }
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  async listProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProjectsByResponsible(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.responsibleId === userId
    );
  }
  
  async getProjectsByStatus(status: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.status === status
    );
  }
  
  async getProjectsByMunicipality(municipality: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.municipality === municipality
    );
  }
  
  // Contact operations
  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const newContact: Contact = {
      ...contact,
      id,
      createdAt: new Date().toISOString(),
    };
    this.contacts.set(id, newContact);
    return newContact;
  }
  
  async getContactsByProject(projectId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      (contact) => contact.projectId === projectId
    );
  }
  
  // Project updates operations
  async createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate> {
    const id = this.currentProjectUpdateId++;
    const newUpdate: ProjectUpdate = {
      ...update,
      id,
      createdAt: new Date().toISOString(),
    };
    this.projectUpdates.set(id, newUpdate);
    return newUpdate;
  }
  
  async getProjectUpdatesByProject(projectId: number): Promise<ProjectUpdate[]> {
    return Array.from(this.projectUpdates.values())
      .filter((update) => update.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getLatestProjectUpdate(projectId: number): Promise<ProjectUpdate | undefined> {
    const updates = await this.getProjectUpdatesByProject(projectId);
    return updates.length > 0 ? updates[0] : undefined;
  }
  
  // Subproject operations
  async createSubproject(subproject: InsertSubproject): Promise<Subproject> {
    const id = this.currentSubprojectId++;
    const now = new Date().toISOString();
    const newSubproject: Subproject = {
      ...subproject,
      id,
      statusUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.subprojects.set(id, newSubproject);
    return newSubproject;
  }
  
  async getSubproject(id: number): Promise<Subproject | undefined> {
    return this.subprojects.get(id);
  }
  
  async updateSubproject(id: number, subproject: Partial<InsertSubproject>): Promise<Subproject | undefined> {
    const existingSubproject = this.subprojects.get(id);
    if (!existingSubproject) return undefined;
    
    const updatedSubproject: Subproject = {
      ...existingSubproject,
      ...subproject,
      updatedAt: new Date().toISOString(),
    };
    
    // If status is changed, update the statusUpdatedAt
    if (subproject.status && subproject.status !== existingSubproject.status) {
      updatedSubproject.statusUpdatedAt = new Date().toISOString();
    }
    
    this.subprojects.set(id, updatedSubproject);
    return updatedSubproject;
  }
  
  async deleteSubproject(id: number): Promise<boolean> {
    return this.subprojects.delete(id);
  }
  
  async getSubprojectsByProject(projectId: number): Promise<Subproject[]> {
    return Array.from(this.subprojects.values()).filter(
      (subproject) => subproject.projectId === projectId
    );
  }
  
  async getSubprojectsByResponsible(userId: number): Promise<Subproject[]> {
    return Array.from(this.subprojects.values()).filter(
      (subproject) => subproject.responsibleId === userId
    );
  }
  
  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date().toISOString();
    const newActivity: Activity = {
      ...activity,
      id,
      statusUpdatedAt: now,
      isDelayed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }
  
  async updateActivity(id: number, activity: UpdateActivity): Promise<Activity | undefined> {
    const existingActivity = this.activities.get(id);
    if (!existingActivity) return undefined;
    const updatedActivity: Activity = {
      ...existingActivity,
      ...activity,
      updatedAt: new Date().toISOString(),
    };
    if (activity.status && activity.status !== existingActivity.status) {
      updatedActivity.statusUpdatedAt = new Date().toISOString();
    }
    if (typeof activity.isDelayed === 'boolean') {
      updatedActivity.isDelayed = activity.isDelayed;
    }
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }
  
  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }
  
  async getActivitiesBySubproject(subprojectId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.subprojectId === subprojectId
    );
  }
  
  async getActivitiesByResponsible(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.responsibleId === userId
    );
  }
  
  async getDelayedActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.isDelayed
    );
  }
  
  // Activity comments operations
  async createActivityComment(comment: InsertActivityComment): Promise<ActivityComment> {
    const id = this.currentActivityCommentId++;
    const newComment: ActivityComment = {
      ...comment,
      id,
      createdAt: new Date().toISOString(),
    };
    this.activityComments.set(id, newComment);
    return newComment;
  }
  
  async getActivityCommentsByActivity(activityId: number): Promise<ActivityComment[]> {
    return Array.from(this.activityComments.values())
      .filter((comment) => comment.activityId === activityId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  // Attachment operations
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const id = this.currentAttachmentId++;
    const newAttachment: Attachment = {
      ...attachment,
      id,
      createdAt: new Date().toISOString(),
    };
    this.attachments.set(id, newAttachment);
    return newAttachment;
  }
  
  async getAttachmentsByEntity(entityType: string, entityId: number): Promise<Attachment[]> {
    return Array.from(this.attachments.values()).filter((attachment) => {
      if (entityType === "project" && attachment.projectId === entityId) return true;
      if (entityType === "subproject" && attachment.subprojectId === entityId) return true;
      if (entityType === "activity" && attachment.activityId === entityId) return true;
      return false;
    });
  }
  
  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const now = new Date().toISOString();
    const newEvent: Event = {
      ...event,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent: Event = {
      ...existingEvent,
      ...event,
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }
  
  async getEventsByProject(projectId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.projectId === projectId
    );
  }
  
  async getEventsBySubproject(subprojectId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.subprojectId === subprojectId
    );
  }
  
  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= startDate && eventStart <= endDate;
    });
  }
  
  async listEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  // Audit logs operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const id = this.currentAuditLogId++;
    const newLog: AuditLog = {
      ...log,
      id,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.set(id, newLog);
    return newLog;
  }
  
  async getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter((log) => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Dashboard operations
  async getDashboardStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    delayedProjects: number;
    completedProjects: number;
  }> {
    const allProjects = Array.from(this.projects.values());
    
    return {
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(p => p.status === "Em andamento").length,
      delayedProjects: allProjects.filter(p => p.isDelayed).length,
      completedProjects: allProjects.filter(p => p.status === "Finalizado").length
    };
  }
}

export const storage = new MemStorage();
