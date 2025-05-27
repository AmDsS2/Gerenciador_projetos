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
  insertAuditLogSchema
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
      const userData = schema.insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
  
  app.post("/api/projects", async (req, res) => {
    try {
      console.log("Dados do projeto recebidos:", req.body);
      const projectData = schema.insertProjectSchema.parse(req.body);
      console.log("Dados do projeto validados:", projectData);
      const project = await storage.createProject(projectData);
      console.log("Projeto criado:", project);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "project",
        entityId: project.id,
        action: "create",
        after: project,
        userId: (req.user as any).id,
      });
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      res.status(400).json({ message: "Erro ao criar projeto", error: error.message });
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
      const projectData = schema.insertProjectSchema.partial().parse(req.body);
      
      const existingProject = await storage.getProject(projectId);
      
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Garante que o ID não seja alterado
      delete projectData.id;
      
      const updatedProject = await storage.updateProject(projectId, projectData);
      
      if (!updatedProject) {
        return res.status(500).json({ message: "Failed to update project" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "project",
        entityId: projectId,
        action: "update",
        before: existingProject,
        after: updatedProject,
        userId: (req.user as any).id,
      });
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      res.status(400).json({ message: "Invalid data", error: error.message });
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
        before: existingProject,
        userId: (req.user as any).id,
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
      const contactData = schema.insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
      const updateData = schema.insertProjectUpdateSchema.parse(req.body);
      const update = await storage.createProjectUpdate(updateData);
      res.status(201).json(update);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
      const subprojectData = schema.insertSubprojectSchema.parse(req.body);
      const subproject = await storage.createSubproject(subprojectData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "subproject",
        entityId: subproject.id,
        action: "create",
        after: subproject,
        userId: (req.user as any).id,
      });
      
      res.status(201).json(subproject);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
      const subprojectData = schema.insertSubprojectSchema.partial().parse(req.body);
      
      const existingSubproject = await storage.getSubproject(subprojectId);
      
      if (!existingSubproject) {
        return res.status(404).json({ message: "Subproject not found" });
      }
      
      const updatedSubproject = await storage.updateSubproject(subprojectId, subprojectData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "subproject",
        entityId: subprojectId,
        action: "update",
        before: existingSubproject,
        after: updatedSubproject,
        userId: (req.user as any).id,
      });
      
      res.json(updatedSubproject);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
        before: existingSubproject,
        userId: (req.user as any).id,
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
      const activityData = schema.insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "activity",
        entityId: activity.id,
        action: "create",
        after: activity,
        userId: (req.user as any).id,
      });
      
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
      const activityData = schema.insertActivitySchema.partial().parse(req.body);
      
      const existingActivity = await storage.getActivity(activityId);
      
      if (!existingActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      const updatedActivity = await storage.updateActivity(activityId, activityData);
      
      // Create audit log
      await storage.createAuditLog({
        entityType: "activity",
        entityId: activityId,
        action: "update",
        before: existingActivity,
        after: updatedActivity,
        userId: (req.user as any).id,
      });
      
      res.json(updatedActivity);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
        before: existingActivity,
        userId: (req.user as any).id,
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
      const commentData = schema.insertActivityCommentSchema.parse(req.body);
      const comment = await storage.createActivityComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
      const attachmentData = schema.insertAttachmentSchema.parse(req.body);
      const attachment = await storage.createAttachment(attachmentData);
      res.status(201).json(attachment);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
      console.log("Dados recebidos na rota /api/events:", JSON.stringify(req.body, null, 2));
      
      // Validar os dados antes de criar o evento
      const eventData = schema.insertEventSchema.parse(req.body);
      console.log("Dados validados:", JSON.stringify(eventData, null, 2));
      
      const event = await storage.createEvent(eventData);
      console.log("Evento criado:", JSON.stringify(event, null, 2));
      
      res.status(201).json(event);
    } catch (error: any) {
      console.error("Erro detalhado ao criar evento:", error);
      res.status(400).json({ 
        message: "Invalid data", 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error.errors || error
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
      const eventData = schema.insertEventSchema.partial().parse(req.body);
      
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
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
