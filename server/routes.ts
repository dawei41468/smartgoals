import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGoalSchema, updateUserProfileSchema, updateUserSettingsSchema, loginSchema, registerSchema, type AIBreakdownRequest } from "@shared/schema";
import { generateGoalBreakdown, regenerateGoalBreakdown } from "./services/deepseek";
import { generateToken, comparePassword, authenticateToken, type AuthRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await storage.registerUser(userData);
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        user: userWithoutPassword,
        token,
        message: "User registered successfully",
      });
    } catch (error) {
      if ((error as Error).message.includes("already exists")) {
        res.status(409).json({ message: (error as Error).message });
      } else {
        res.status(400).json({ message: "Invalid registration data", error: (error as Error).message });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
        message: "Login successful",
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data", error: (error as Error).message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: "Logout successful" });
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Fetch fresh user data
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data", error: (error as Error).message });
    }
  });

  // User profile endpoints
  app.get("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile", error: (error as Error).message });
    }
  });

  app.patch("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const profileData = updateUserProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(req.user.id, profileData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        type: "profile_updated",
        description: "Updated profile information",
        metadata: { updatedFields: Object.keys(profileData) }
      });
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid profile data", error: (error as Error).message });
    }
  });

  app.get("/api/user/settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const settings = await storage.getUserSettings(req.user.id);
      if (!settings) {
        return res.status(404).json({ message: "User settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user settings", error: (error as Error).message });
    }
  });

  app.patch("/api/user/settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const settingsData = updateUserSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateUserSettings(req.user.id, settingsData);
      if (!updatedSettings) {
        return res.status(404).json({ message: "Failed to update settings" });
      }
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        type: "settings_updated",
        description: "Updated account settings",
        metadata: { updatedSettings: Object.keys(settingsData) }
      });
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data", error: (error as Error).message });
    }
  });

  // Goals endpoints
  app.post("/api/goals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(goalData, req.user.id);
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        type: "goal_created",
        description: `Created new goal: ${goal.title}`,
        metadata: { goalId: goal.id, goalTitle: goal.title }
      });
      
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data", error: (error as Error).message });
    }
  });

  app.get("/api/goals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const goals = await storage.getGoalsByUserId(req.user.id);
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
  app.patch("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const task = await storage.updateDailyTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Log activity if task was marked as completed
      if (req.body.completed === true && task.completed) {
        await storage.createActivity({
          userId: req.user.id,
          type: "task_completed",
          description: `Completed task: ${task.title}`,
          metadata: { taskId: task.id, taskTitle: task.title }
        });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task", error: (error as Error).message });
    }
  });

  // Activity endpoints
  app.get("/api/activities", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getUserActivities(req.user.id, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities", error: (error as Error).message });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
