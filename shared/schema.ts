import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(false),
  weeklyDigest: boolean("weekly_digest").default(true),
  goalReminders: boolean("goal_reminders").default(true),
  defaultGoalDuration: text("default_goal_duration").default("3-months"),
  aiBreakdownDetail: text("ai_breakdown_detail").default("detailed"),
  theme: text("theme").default("light"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Health, Work, Family, Personal
  specific: text("specific").notNull(),
  measurable: text("measurable").notNull(),
  achievable: text("achievable").notNull(),
  relevant: text("relevant").notNull(),
  timebound: text("timebound").notNull(),
  exciting: text("exciting").notNull(),
  deadline: text("deadline").notNull(),
  progress: integer("progress").default(0),
  status: text("status").default("active"), // active, completed, paused
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const weeklyGoals = pgTable("weekly_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  weekNumber: integer("week_number").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  progress: integer("progress").default(0),
  status: text("status").default("pending"), // pending, active, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weeklyGoalId: varchar("weekly_goal_id").notNull(),
  goalId: varchar("goal_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  day: integer("day").notNull(), // 1-7 for days of the week
  date: text("date"),
  completed: boolean("completed").default(false),
  priority: text("priority").default("medium"), // low, medium, high
  estimatedHours: integer("estimated_hours").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // goal_created, goal_completed, task_completed, profile_updated, etc.
  description: text("description").notNull(),
  metadata: json("metadata"), // Additional data specific to the activity type
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  email: true,
  bio: true,
});

export const updateUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  userId: true,
  progress: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  category: z.enum(["Health", "Work", "Family", "Personal"]),
});

export const insertWeeklyGoalSchema = createInsertSchema(weeklyGoals).omit({
  id: true,
  progress: true,
  status: true,
  createdAt: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
  completed: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertWeeklyGoal = z.infer<typeof insertWeeklyGoalSchema>;
export type WeeklyGoal = typeof weeklyGoals.$inferSelect;
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export interface GoalWithBreakdown extends Goal {
  weeklyGoals: (WeeklyGoal & { tasks: DailyTask[] })[];
}

export interface AIBreakdownRequest {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
  exciting: string;
  deadline: string;
}

export interface AIBreakdownResponse {
  weeklyGoals: {
    title: string;
    description: string;
    weekNumber: number;
    tasks: {
      title: string;
      description: string;
      day: number;
      priority: string;
      estimatedHours: number;
    }[];
  }[];
}
