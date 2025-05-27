import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from './schema';
import { setupAutomation } from "./utils/automation";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import cors from "cors";
import { 
  insertUserSchema,
  insertProjectSchema,
  insertContactSchema,
  insertProjectUpdateSchema,
  insertSubprojectSchema,
  insertActivitySchema,
  insertActivityCommentSchema,
  insertAttachmentSchema,
  insertEventSchema,
  insertAuditLogSchema,
  type InsertUser,
  type InsertProject,
  type InsertContact,
  type InsertProjectUpdate,
  type InsertSubproject,
  type InsertActivity,
  type InsertActivityComment,
  type InsertAttachment,
  type InsertEvent,
  type InsertAuditLog,
  type Project
} from "@shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar CORS
  app.use(cors({
    origin: function(origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`Origem bloqueada pelo CORS: ${origin}`);
        callback(new Error('Não permitido pelo CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400 // 24 horas
  }));

  // Middleware para logging de CORS
  app.use((req, res, next) => {
    console.log(`[CORS] ${req.method} ${req.url}`);
    console.log(`[CORS] Origin: ${req.headers.origin}`);
    console.log(`[CORS] Headers: ${JSON.stringify(req.headers)}`);
    next();
  });

  // Set up middleware for sessions and authentication
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Desabilitado em desenvolvimento
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax",
      },
    })
  );
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Set up passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Tentando login com:", { username, password });
        const user = await storage.getUserByUsername(username);
        console.log("Usuário encontrado:", user);
        
        if (!user) {
          console.log("Usuário não encontrado");
          return done(null, false, { message: "Nome de usuário ou senha incorreta" });
        }
        
        if (user.password !== password) {
          console.log("Senha incorreta");
          return done(null, false, { message: "Nome de usuário ou senha incorreta" });
        }
        
        console.log("Login bem sucedido");
        return done(null, user);
      } catch (error) {
        console.error("Erro durante login:", error);
        return done(error);
      }
    })
  );
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Middleware para simular usuário autenticado
  app.use((req: Request, res: Response, next) => {
    (req as any).user = {
      id: 1,
      username: "admin",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin"
    };
    next();
  });
  
  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  const isAdmin = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };
  
  // Authentication routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });
  
  // Rota temporária para criar usuário admin
  app.post("/api/auth/create-admin", async (req, res) => {
    try {
      console.log("Criando usuário admin...");
      const existingUser = await storage.getUserByUsername("admin");
      
      if (existingUser) {
        console.log("Usuário admin já existe");
        return res.status(200).json(existingUser);
      }
      
      const user = await storage.createUser({
        username: "admin",
        password: "admin123",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
      });
      console.log("Usuário admin criado:", user);
      res.status(201).json(user);
    } catch (error) {
      console.error("Erro ao criar usuário admin:", error);
      res.status(400).json({ message: "Erro ao criar usuário admin" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const userData: InsertUser = {
        username: req.body.username,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || 'user',
        avatar: req.body.avatar || null
      };
      
      const validatedData = insertUserSchema.parse(userData);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const { status, responsible, municipality } = req.query;
      
      let projects;
      
      if (status) {
        projects = await storage.getProjectsByStatus(status as string);
      } else if (responsible) {
        projects = await storage.getProjectsByResponsible(parseInt(responsible as string));
      } else if (municipality) {
        projects = await storage.getProjectsByMunicipality(municipality as string);
      } else {
        projects = await storage.listProjects();
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Erro ao listar projetos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projectData: InsertProject = {
        name: req.body.name,
        description: req.body.description || null,
        status: req.body.status || 'Em andamento',
        municipality: req.body.municipality || null,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        responsibleId: req.body.responsibleId || null,
        sla: req.body.sla || null,
        checklist: req.body.checklist || null
      };
      
      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData);
      
      // Registrar no log de auditoria
      const auditLog: InsertAuditLog = {
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'project',
        entityId: project.id,
        details: { project }
      };
      
      await storage.createAuditLog(auditLog);
      res.status(201).json(project);
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const projectData: Partial<InsertProject> = {
        name: req.body.name,
        status: req.body.status,
        description: req.body.description,
        municipality: req.body.municipality,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        responsibleId: req.body.responsibleId,
        sla: req.body.sla,
        checklist: req.body.checklist
      };

      const project = await storage.updateProject(projectId, projectData);
      
      // Registrar no log de auditoria
      const auditLog: InsertAuditLog = {
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'project',
        entityId: projectId,
        details: { project }
      };
      
      await storage.createAuditLog(auditLog);
      res.json(project);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const existingProject = await storage.getProject(projectId);
      
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      await storage.deleteProject(projectId);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "project",
        entityId: projectId,
        action: "delete",
        userId: (req.user as any).id,
        details: { before: existingProject }
      });
      
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Contact routes
  app.get("/api/projects/:id/contacts", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const contacts = await storage.getContactsByProject(projectId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const contactData: InsertContact = {
        name: req.body.name,
        projectId: req.body.projectId || 1, // Valor padrão temporário
        email: req.body.email || null,
        role: req.body.role || null,
        phone: req.body.phone || null,
        notes: req.body.notes || null
      };
      
      const validatedData = insertContactSchema.parse(contactData);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Erro ao criar contato:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Project updates routes
  app.get("/api/projects/:id/updates", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = await storage.getProjectUpdatesByProject(projectId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/project-updates", isAuthenticated, async (req, res) => {
    try {
      const updateData: InsertProjectUpdate = {
        projectId: req.body.projectId || 1, // Valor padrão temporário
        content: req.body.content,
        userId: (req.user as any).id
      };
      
      const validatedData = insertProjectUpdateSchema.parse(updateData);
      const update = await storage.createProjectUpdate(validatedData);
      res.status(201).json(update);
    } catch (error) {
      console.error("Erro ao criar atualização:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Subproject routes
  app.get("/api/projects/:id/subprojects", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const subprojects = await storage.getSubprojectsByProject(projectId);
      res.json(subprojects);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/subprojects", isAuthenticated, async (req, res) => {
    try {
      const subprojectData: InsertSubproject = {
        name: req.body.name,
        description: req.body.description || null,
        status: req.body.status || 'Em andamento',
        projectId: req.body.projectId || 1, // Valor padrão temporário
        responsibleId: req.body.responsibleId || null,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null
      };
      
      const validatedData = insertSubprojectSchema.parse(subprojectData);
      const subproject = await storage.createSubproject(validatedData);
      res.status(201).json(subproject);
    } catch (error) {
      console.error("Erro ao criar subprojeto:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.get("/api/subprojects/:id", isAuthenticated, async (req, res) => {
    try {
      const subprojectId = parseInt(req.params.id);
      const subproject = await storage.getSubproject(subprojectId);
      
      if (!subproject) {
        return res.status(404).json({ message: "Subproject not found" });
      }
      
      res.json(subproject);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/subprojects/:id", isAuthenticated, async (req, res) => {
    try {
      const subprojectId = parseInt(req.params.id);
      const subprojectData: Partial<InsertSubproject> = {
        name: req.body.name,
        status: req.body.status,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        responsibleId: req.body.responsibleId,
        projectId: req.body.projectId
      };

      const subproject = await storage.updateSubproject(subprojectId, subprojectData);
      
      // Registrar no log de auditoria
      const auditLog: InsertAuditLog = {
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'subproject',
        entityId: subprojectId,
        details: { subproject }
      };
      
      await storage.createAuditLog(auditLog);
      res.json(subproject);
    } catch (error) {
      console.error("Erro ao atualizar subprojeto:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.delete("/api/subprojects/:id", isAuthenticated, async (req, res) => {
    try {
      const subprojectId = parseInt(req.params.id);
      const existingSubproject = await storage.getSubproject(subprojectId);
      
      if (!existingSubproject) {
        return res.status(404).json({ message: "Subproject not found" });
      }
      
      await storage.deleteSubproject(subprojectId);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "subproject",
        entityId: subprojectId,
        action: "delete",
        userId: (req.user as any).id,
        details: { before: existingSubproject }
      });
      
      res.json({ message: "Subproject deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Activity routes
  app.get("/api/subprojects/:id/activities", isAuthenticated, async (req, res) => {
    try {
      const subprojectId = parseInt(req.params.id);
      const activities = await storage.getActivitiesBySubproject(subprojectId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const activityData: InsertActivity = {
        name: req.body.name,
        status: req.body.status || 'Em andamento',
        description: req.body.description || null,
        startDate: req.body.startDate || null,
        responsibleId: req.body.responsibleId || null,
        sla: req.body.sla || null,
        checklist: req.body.checklist || null,
        subprojectId: req.body.subprojectId,
        dueDate: req.body.dueDate || null
      };
      
      const validatedData = insertActivitySchema.parse(activityData);
      const activity = await storage.createActivity(validatedData);
      
      // Registrar no log de auditoria
      const auditLog: InsertAuditLog = {
        userId: (req.user as any).id,
        action: 'create',
        entityType: 'activity',
        entityId: activity.id,
        details: { activity }
      };
      
      await storage.createAuditLog(auditLog);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Erro ao criar atividade:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.get("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const activityData: Partial<InsertActivity> = {
        name: req.body.name,
        status: req.body.status,
        description: req.body.description,
        startDate: req.body.startDate,
        responsibleId: req.body.responsibleId,
        sla: req.body.sla,
        checklist: req.body.checklist,
        subprojectId: req.body.subprojectId,
        dueDate: req.body.dueDate
      };

      const activity = await storage.updateActivity(activityId, activityData);
      
      // Registrar no log de auditoria
      const auditLog: InsertAuditLog = {
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'activity',
        entityId: activityId,
        details: { activity }
      };
      
      await storage.createAuditLog(auditLog);
      res.json(activity);
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.delete("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const existingActivity = await storage.getActivity(activityId);
      
      if (!existingActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      await storage.deleteActivity(activityId);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "activity",
        entityId: activityId,
        action: "delete",
        userId: (req.user as any).id,
        details: { before: existingActivity }
      });
      
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Activity comments routes
  app.get("/api/activities/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const comments = await storage.getActivityCommentsByActivity(activityId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/activity-comments", isAuthenticated, async (req, res) => {
    try {
      const commentData: InsertActivityComment = {
        content: req.body.content,
        userId: (req.user as any).id,
        activityId: req.body.activityId
      };
      
      const validatedData = insertActivityCommentSchema.parse(commentData);
      const comment = await storage.createActivityComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Erro ao criar comentário:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Attachment routes
  app.get("/api/attachments", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.query;
      
      if (!entityType || !entityId) {
        return res.status(400).json({ message: "Missing entityType or entityId" });
      }
      
      const attachments = await storage.getAttachmentsByEntity(
        entityType as string,
        parseInt(entityId as string)
      );
      
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/attachments", isAuthenticated, async (req, res) => {
    try {
      const attachmentData: InsertAttachment = {
        path: req.body.path,
        filename: req.body.filename,
        projectId: req.body.projectId || null,
        subprojectId: req.body.subprojectId || null,
        activityId: req.body.activityId || null,
        fileType: req.body.fileType || null,
        fileSize: req.body.fileSize || null,
        uploadedBy: (req.user as any).id
      };
      
      const validatedData = insertAttachmentSchema.parse(attachmentData);
      const attachment = await storage.createAttachment(validatedData);
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Erro ao criar anexo:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Event routes
  app.get("/api/events", isAuthenticated, async (req, res) => {
    try {
      const { projectId, subprojectId, startDate, endDate } = req.query;
      
      console.log("Parâmetros recebidos:", { projectId, subprojectId, startDate, endDate });
      
      let events;
      
      if (projectId) {
        events = await storage.getEventsByProject(parseInt(projectId as string));
      } else if (subprojectId) {
        events = await storage.getEventsBySubproject(parseInt(subprojectId as string));
      } else if (startDate && endDate) {
        events = await storage.getEventsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        events = await storage.listEvents();
      }
      
      console.log("Eventos encontrados:", events);
      
      res.json(events);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const eventData: InsertEvent = {
        title: req.body.title,
        description: req.body.description || null,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: req.body.location || null,
        projectId: req.body.projectId || null,
        subprojectId: req.body.subprojectId || null,
        createdBy: (req.user as any).id
      };
      
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.get("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const eventData: Partial<InsertEvent> = {
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: req.body.location,
        projectId: req.body.projectId,
        subprojectId: req.body.subprojectId,
        createdBy: (req.user as any).id
      };

      const event = await storage.updateEvent(eventId, eventData);
      
      // Registrar no log de auditoria
      const auditLog: InsertAuditLog = {
        userId: (req.user as any).id,
        action: 'update',
        entityType: 'event',
        entityId: eventId,
        details: { event }
      };
      
      await storage.createAuditLog(auditLog);
      res.json(event);
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.delete("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const success = await storage.deleteEvent(eventId);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Audit log routes
  app.get("/api/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.query;
      
      if (!entityType || !entityId) {
        return res.status(400).json({ message: "Missing entityType or entityId" });
      }
      
      const logs = await storage.getAuditLogsByEntity(
        entityType as string,
        parseInt(entityId as string)
      );
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Dashboard route
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  
  // Set up automation
  setupAutomation(storage);
  
  return httpServer;
}
