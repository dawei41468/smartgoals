import { type User, type InsertUser, type Goal, type InsertGoal, type WeeklyGoal, type InsertWeeklyGoal, type DailyTask, type InsertDailyTask, type GoalWithBreakdown } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Goal methods
  createGoal(goal: InsertGoal, userId: string): Promise<Goal>;
  getGoal(id: string): Promise<Goal | undefined>;
  getGoalsByUserId(userId: string): Promise<Goal[]>;
  getGoalWithBreakdown(id: string): Promise<GoalWithBreakdown | undefined>;
  updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
  
  // Weekly goal methods
  createWeeklyGoal(weeklyGoal: InsertWeeklyGoal): Promise<WeeklyGoal>;
  getWeeklyGoalsByGoalId(goalId: string): Promise<WeeklyGoal[]>;
  updateWeeklyGoal(id: string, updates: Partial<WeeklyGoal>): Promise<WeeklyGoal | undefined>;
  
  // Daily task methods
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  getDailyTasksByWeeklyGoalId(weeklyGoalId: string): Promise<DailyTask[]>;
  updateDailyTask(id: string, updates: Partial<DailyTask>): Promise<DailyTask | undefined>;
  
  // Analytics methods
  getUserStats(userId: string): Promise<{
    activeGoalsCount: number;
    completedTasksCount: number;
    successRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private goals: Map<string, Goal>;
  private weeklyGoals: Map<string, WeeklyGoal>;
  private dailyTasks: Map<string, DailyTask>;

  constructor() {
    this.users = new Map();
    this.goals = new Map();
    this.weeklyGoals = new Map();
    this.dailyTasks = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createGoal(insertGoal: InsertGoal, userId: string): Promise<Goal> {
    const id = randomUUID();
    const now = new Date();
    const goal: Goal = {
      ...insertGoal,
      id,
      userId,
      progress: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    this.goals.set(id, goal);
    return goal;
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async getGoalsByUserId(userId: string): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  async getGoalWithBreakdown(id: string): Promise<GoalWithBreakdown | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const weeklyGoals = await this.getWeeklyGoalsByGoalId(id);
    const weeklyGoalsWithTasks = await Promise.all(
      weeklyGoals.map(async (weeklyGoal) => {
        const tasks = await this.getDailyTasksByWeeklyGoalId(weeklyGoal.id);
        return { ...weeklyGoal, tasks };
      })
    );

    return { ...goal, weeklyGoals: weeklyGoalsWithTasks };
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updatedGoal = { ...goal, ...updates, updatedAt: new Date() };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  async createWeeklyGoal(insertWeeklyGoal: InsertWeeklyGoal): Promise<WeeklyGoal> {
    const id = randomUUID();
    const weeklyGoal: WeeklyGoal = {
      ...insertWeeklyGoal,
      id,
      progress: 0,
      status: "pending",
      createdAt: new Date(),
    };
    this.weeklyGoals.set(id, weeklyGoal);
    return weeklyGoal;
  }

  async getWeeklyGoalsByGoalId(goalId: string): Promise<WeeklyGoal[]> {
    return Array.from(this.weeklyGoals.values())
      .filter(weeklyGoal => weeklyGoal.goalId === goalId)
      .sort((a, b) => a.weekNumber - b.weekNumber);
  }

  async updateWeeklyGoal(id: string, updates: Partial<WeeklyGoal>): Promise<WeeklyGoal | undefined> {
    const weeklyGoal = this.weeklyGoals.get(id);
    if (!weeklyGoal) return undefined;

    const updatedWeeklyGoal = { ...weeklyGoal, ...updates };
    this.weeklyGoals.set(id, updatedWeeklyGoal);
    return updatedWeeklyGoal;
  }

  async createDailyTask(insertDailyTask: InsertDailyTask): Promise<DailyTask> {
    const id = randomUUID();
    const task: DailyTask = {
      ...insertDailyTask,
      id,
      completed: false,
      createdAt: new Date(),
    };
    this.dailyTasks.set(id, task);
    return task;
  }

  async getDailyTasksByWeeklyGoalId(weeklyGoalId: string): Promise<DailyTask[]> {
    return Array.from(this.dailyTasks.values())
      .filter(task => task.weeklyGoalId === weeklyGoalId)
      .sort((a, b) => a.day - b.day);
  }

  async updateDailyTask(id: string, updates: Partial<DailyTask>): Promise<DailyTask | undefined> {
    const task = this.dailyTasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.dailyTasks.set(id, updatedTask);
    return updatedTask;
  }

  async getUserStats(userId: string): Promise<{
    activeGoalsCount: number;
    completedTasksCount: number;
    successRate: number;
  }> {
    const userGoals = await this.getGoalsByUserId(userId);
    const activeGoalsCount = userGoals.filter(goal => goal.status === "active").length;
    
    // Count completed tasks across all user goals
    let completedTasksCount = 0;
    let totalTasksCount = 0;
    
    for (const goal of userGoals) {
      const weeklyGoals = await this.getWeeklyGoalsByGoalId(goal.id);
      for (const weeklyGoal of weeklyGoals) {
        const tasks = await this.getDailyTasksByWeeklyGoalId(weeklyGoal.id);
        totalTasksCount += tasks.length;
        completedTasksCount += tasks.filter(task => task.completed).length;
      }
    }
    
    const successRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    
    return {
      activeGoalsCount,
      completedTasksCount,
      successRate,
    };
  }
}

export const storage = new MemStorage();
