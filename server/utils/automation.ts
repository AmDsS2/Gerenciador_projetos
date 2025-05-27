import { IStorage, UpdateProject, UpdateActivity } from "../storage";
import { differenceInDays } from "date-fns";
import { Project, Activity } from "@shared/types";

// Function to check if projects are delayed based on SLA
async function checkProjectDelays(storage: IStorage) {
  console.log("Running automation: Checking project delays...");
  
  const projects = await storage.listProjects();
  const now = new Date();
  
  for (const project of projects) {
    // Skip completed projects
    if (project.status === "Finalizado") {
      continue;
    }
    
    // Check if project has an SLA and an end date
    if (project.sla && project.endDate) {
      const dueDate = new Date(project.endDate);
      const daysUntilDue = differenceInDays(dueDate, now);
      
      // If days until due is less than SLA and project is not already marked as delayed
      if (daysUntilDue < 0 && !project.isDelayed) {
        await storage.updateProject(project.id, {
          status: project.status,
          isDelayed: true,
        });
        
        console.log(`Project ${project.id} (${project.name}) marked as delayed`);
      }
      // If project was delayed but is now within SLA range
      else if (daysUntilDue >= 0 && project.isDelayed) {
        await storage.updateProject(project.id, {
          status: project.status,
          isDelayed: false,
        });
        
        console.log(`Project ${project.id} (${project.name}) is no longer delayed`);
      }
    }
  }
}

// Function to check if activities are delayed based on SLA
async function checkActivityDelays(storage: IStorage) {
  console.log("Running automation: Checking activity delays...");
  
  const projects = await storage.listProjects();
  const subprojects = (await Promise.all(projects.map(p => storage.getSubprojectsByProject(p.id)))).flat();
  const activities = (await Promise.all(subprojects.map(s => storage.getActivitiesBySubproject(s.id)))).flat();
  
  const now = new Date();
  
  for (const activity of activities) {
    // Skip completed activities
    if (activity.status === "Finalizado") {
      continue;
    }
    
    // Check if activity has an SLA and a due date
    if (activity.sla && activity.dueDate) {
      const dueDate = new Date(activity.dueDate);
      const daysUntilDue = differenceInDays(dueDate, now);
      
      // If days until due is less than SLA and activity is not already marked as delayed
      if (daysUntilDue < 0 && !activity.isDelayed) {
        await storage.updateActivity(activity.id, {
          status: activity.status,
          isDelayed: true,
        });
        
        console.log(`Activity ${activity.id} (${activity.name}) marked as delayed`);
      }
      // If activity was delayed but is now within SLA range
      else if (daysUntilDue >= 0 && activity.isDelayed) {
        await storage.updateActivity(activity.id, {
          status: activity.status,
          isDelayed: false,
        });
        
        console.log(`Activity ${activity.id} (${activity.name}) is no longer delayed`);
      }
    }
  }
}

// Function to check for daily updates on projects
async function checkDailyUpdates(storage: IStorage) {
  console.log("Running automation: Checking daily updates...");
  
  const projects = await storage.listProjects();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  for (const project of projects) {
    // Skip completed projects
    if (project.status === "Finalizado") {
      continue;
    }
    
    const latestUpdate = await storage.getLatestProjectUpdate(project.id);
    
    if (!latestUpdate) {
      console.log(`Project ${project.id} (${project.name}) has no updates`);
      continue;
    }
    
    const updateDate = new Date(latestUpdate.createdAt);
    const updateDay = new Date(updateDate.getFullYear(), updateDate.getMonth(), updateDate.getDate());
    
    // If latest update is not from today
    if (differenceInDays(today, updateDay) > 0) {
      console.log(`Project ${project.id} (${project.name}) has not been updated today`);
      
      // TODO: In a real application, send email notifications here
    }
  }
}

// Main automation setup function
export function setupAutomation(storage: IStorage) {
  // Run automations every hour
  const ONE_HOUR = 60 * 60 * 1000;
  
  // Initial run
  setTimeout(() => {
    checkProjectDelays(storage);
    checkActivityDelays(storage);
    checkDailyUpdates(storage);
  }, 5000);
  
  // Schedule runs every hour
  setInterval(() => {
    checkProjectDelays(storage);
    checkActivityDelays(storage);
    checkDailyUpdates(storage);
  }, ONE_HOUR);
  
  console.log("Automation tasks scheduled");
}
