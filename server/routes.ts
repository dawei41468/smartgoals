import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGoalSchema, type AIBreakdownRequest } from "@shared/schema";
import { generateGoalBreakdown, regenerateGoalBreakdown } from "./services/deepseek";

export async function registerRoutes(app: Express): Promise<Server> {
  // Goals endpoints
  app.post("/api/goals", async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      // For demo purposes, using a fixed user ID
      const userId = "demo-user";
      
      const goal = await storage.createGoal(goalData, userId);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data", error: (error as Error).message });
    }
  });

  app.get("/api/goals", async (req, res) => {
    try {
      // For demo purposes, using a fixed user ID
      const userId = "demo-user";
      const goals = await storage.getGoalsByUserId(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals", error: (error as Error).message });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.getGoalWithBreakdown(req.params.id);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goal", error: (error as Error).message });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.updateGoal(req.params.id, req.body);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update goal", error: (error as Error).message });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGoal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json({ message: "Goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal", error: (error as Error).message });
    }
  });

  // AI breakdown endpoints
  app.post("/api/goals/breakdown", async (req, res) => {
    try {
      const breakdownRequest: AIBreakdownRequest = req.body;
      const breakdown = await generateGoalBreakdown(breakdownRequest);
      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate goal breakdown", 
        error: (error as Error).message 
      });
    }
  });

  app.post("/api/goals/breakdown/regenerate", async (req, res) => {
    try {
      const { goalData, feedback } = req.body;
      const breakdown = await regenerateGoalBreakdown(goalData, feedback);
      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to regenerate goal breakdown", 
        error: (error as Error).message 
      });
    }
  });

  // Save complete goal with breakdown
  app.post("/api/goals/complete", async (req, res) => {
    try {
      const { goalData, breakdown } = req.body;
      const userId = "demo-user";
      
      // Create the main goal
      const goal = await storage.createGoal(goalData, userId);
      
      // Create weekly goals and daily tasks
      for (const weeklyGoalData of breakdown.weeklyGoals) {
        const weeklyGoal = await storage.createWeeklyGoal({
          goalId: goal.id,
          title: weeklyGoalData.title,
          description: weeklyGoalData.description,
          weekNumber: weeklyGoalData.weekNumber,
          startDate: "", // Calculate based on week number
          endDate: "", // Calculate based on week number
        });

        // Create daily tasks for this weekly goal
        for (const taskData of weeklyGoalData.tasks) {
          await storage.createDailyTask({
            weeklyGoalId: weeklyGoal.id,
            goalId: goal.id,
            title: taskData.title,
            description: taskData.description,
            day: taskData.day,
            date: "", // Calculate based on day
            priority: taskData.priority,
            estimatedHours: taskData.estimatedHours,
          });
        }
      }

      const completeGoal = await storage.getGoalWithBreakdown(goal.id);
      res.json(completeGoal);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to save complete goal", 
        error: (error as Error).message 
      });
    }
  });

  // Task management endpoints
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateDailyTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task", error: (error as Error).message });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const userId = "demo-user";
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
