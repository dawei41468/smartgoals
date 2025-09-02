import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  GoalResponse, 
  ActivityResponse, 
  DailyTaskResponse,
  WeeklyGoalResponse,
  GoalWithBreakdownResponse 
} from '@/lib/types';
import type {
  AnalyticsSummaryResponse,
  CategoryPerformanceResponse,
  ProductivityPatternResponse
} from '@/services/statsService';

// UI State Types
export type ViewType = 'dashboard' | 'wizard' | 'breakdown';

export interface UIState {
  currentView: ViewType;
  isLoading: boolean;
  activeGoalId: string | null;
}

// Progress Data Types
export interface ProgressStats {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalTasks: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekProgress: number;
  avgCompletionTime: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category?: string;
  unlockedAt?: string | null;
  progress?: number;
  target?: number;
}

// Data State Types
export interface DataState {
  goals: GoalResponse[];
  activities: ActivityResponse[];
  weeklyGoals: WeeklyGoalResponse[];
  dailyTasks: DailyTaskResponse[];
  stats: {
    activeGoalsCount: number;
    completedTasksCount: number;
    successRate: number;
  } | null;
  // Analytics data
  analyticsSummary: AnalyticsSummaryResponse | null;
  categoryPerformance: CategoryPerformanceResponse[];
  productivityPatterns: ProductivityPatternResponse[];
  // Progress data
  progressStats: ProgressStats | null;
  achievements: Achievement[];
}

// Actions Interface
export interface AppActions {
  // UI Actions
  setCurrentView: (view: ViewType) => void;
  setLoading: (loading: boolean) => void;
  setActiveGoalId: (id: string | null) => void;
  
  // Goal Actions
  setGoals: (goals: GoalResponse[]) => void;
  addGoal: (goal: GoalResponse) => void;
  updateGoal: (id: string, updates: Partial<GoalResponse>) => void;
  removeGoal: (id: string) => void;
  
  // Activity Actions
  setActivities: (activities: ActivityResponse[]) => void;
  addActivity: (activity: ActivityResponse) => void;
  
  // Weekly Goals Actions
  setWeeklyGoals: (weeklyGoals: WeeklyGoalResponse[]) => void;
  addWeeklyGoal: (weeklyGoal: WeeklyGoalResponse) => void;
  updateWeeklyGoal: (id: string, updates: Partial<WeeklyGoalResponse>) => void;
  removeWeeklyGoal: (id: string) => void;
  
  // Daily Tasks Actions
  setDailyTasks: (tasks: DailyTaskResponse[]) => void;
  addDailyTask: (task: DailyTaskResponse) => void;
  updateDailyTask: (id: string, updates: Partial<DailyTaskResponse>) => void;
  removeDailyTask: (id: string) => void;
  
  // Stats Actions
  setStats: (stats: DataState['stats']) => void;
  
  // Analytics Actions
  setAnalyticsSummary: (summary: AnalyticsSummaryResponse | null) => void;
  setCategoryPerformance: (categories: CategoryPerformanceResponse[]) => void;
  setProductivityPatterns: (patterns: ProductivityPatternResponse[]) => void;
  
  // Progress Actions
  setProgressStats: (stats: ProgressStats | null) => void;
  setAchievements: (achievements: Achievement[]) => void;
  
  // Reset Actions
  reset: () => void;
}

// Combined Store Type
export type AppStore = UIState & DataState & AppActions;

// Initial State
const initialState: UIState & DataState = {
  // UI State
  currentView: 'dashboard',
  isLoading: false,
  activeGoalId: null,
  
  // Data State
  goals: [],
  activities: [],
  weeklyGoals: [],
  dailyTasks: [],
  stats: null,
  // Analytics State
  analyticsSummary: null,
  categoryPerformance: [],
  productivityPatterns: [],
  // Progress State
  progressStats: null,
  achievements: [],
};

// Create Store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // UI Actions
        setCurrentView: (view) => set({ currentView: view }, false, 'setCurrentView'),
        setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
        setActiveGoalId: (id) => set({ activeGoalId: id }, false, 'setActiveGoalId'),
        
        // Goal Actions
        setGoals: (goals) => set({ goals }, false, 'setGoals'),
        addGoal: (goal) => set(
          (state) => ({ goals: [...state.goals, goal] }), 
          false, 
          'addGoal'
        ),
        updateGoal: (id, updates) => set(
          (state) => ({
            goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
          }),
          false,
          'updateGoal'
        ),
        removeGoal: (id) => set(
          (state) => ({
            goals: state.goals.filter(g => g.id !== id),
            activeGoalId: state.activeGoalId === id ? null : state.activeGoalId
          }),
          false,
          'removeGoal'
        ),
        
        // Activity Actions
        setActivities: (activities) => set({ activities }, false, 'setActivities'),
        addActivity: (activity) => set(
          (state) => ({ activities: [activity, ...state.activities] }),
          false,
          'addActivity'
        ),
        
        // Weekly Goals Actions
        setWeeklyGoals: (weeklyGoals) => set({ weeklyGoals }, false, 'setWeeklyGoals'),
        addWeeklyGoal: (weeklyGoal) => set(
          (state) => ({ weeklyGoals: [...state.weeklyGoals, weeklyGoal] }),
          false,
          'addWeeklyGoal'
        ),
        updateWeeklyGoal: (id, updates) => set(
          (state) => ({
            weeklyGoals: state.weeklyGoals.map(wg => wg.id === id ? { ...wg, ...updates } : wg)
          }),
          false,
          'updateWeeklyGoal'
        ),
        removeWeeklyGoal: (id) => set(
          (state) => ({ weeklyGoals: state.weeklyGoals.filter(wg => wg.id !== id) }),
          false,
          'removeWeeklyGoal'
        ),
        
        // Daily Tasks Actions
        setDailyTasks: (tasks) => set({ dailyTasks: tasks }, false, 'setDailyTasks'),
        addDailyTask: (task) => set(
          (state) => ({ dailyTasks: [...state.dailyTasks, task] }),
          false,
          'addDailyTask'
        ),
        updateDailyTask: (id, updates) => set(
          (state) => ({
            dailyTasks: state.dailyTasks.map(task => task.id === id ? { ...task, ...updates } : task)
          }),
          false,
          'updateDailyTask'
        ),
        removeDailyTask: (id) => set(
          (state) => ({ dailyTasks: state.dailyTasks.filter(task => task.id !== id) }),
          false,
          'removeDailyTask'
        ),
        
        // Stats Actions
        setStats: (stats) => set({ stats }, false, 'setStats'),
        
        // Analytics Actions
        setAnalyticsSummary: (summary) => set({ analyticsSummary: summary }, false, 'setAnalyticsSummary'),
        setCategoryPerformance: (categories) => set({ categoryPerformance: categories }, false, 'setCategoryPerformance'),
        setProductivityPatterns: (patterns) => set({ productivityPatterns: patterns }, false, 'setProductivityPatterns'),
        
        // Progress Actions
        setProgressStats: (stats) => set({ progressStats: stats }, false, 'setProgressStats'),
        setAchievements: (achievements) => set({ achievements }, false, 'setAchievements'),
        
        // Reset Actions
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'smartgoals-app-store',
        partialize: (state) => ({
          // Only persist UI preferences, not data
          currentView: state.currentView,
        }),
      }
    ),
    {
      name: 'SmartGoals App Store',
    }
  )
);

// Selectors for better performance
export const useGoals = () => useAppStore((state) => state.goals);
export const useActivities = () => useAppStore((state) => state.activities);
export const useWeeklyGoals = () => useAppStore((state) => state.weeklyGoals);
export const useDailyTasks = () => useAppStore((state) => state.dailyTasks);
export const useStats = () => useAppStore((state) => state.stats);
export const useCurrentView = () => useAppStore((state) => state.currentView);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useActiveGoalId = () => useAppStore((state) => state.activeGoalId);

// Analytics selectors
export const useAnalyticsSummary = () => useAppStore((state) => state.analyticsSummary);
export const useCategoryPerformance = () => useAppStore((state) => state.categoryPerformance);
export const useProductivityPatterns = () => useAppStore((state) => state.productivityPatterns);

// Progress selectors
export const useProgressStats = () => useAppStore((state) => state.progressStats);
export const useAchievements = () => useAppStore((state) => state.achievements);

// Computed selectors
export const useActiveGoal = () => useAppStore((state) => {
  if (!state.activeGoalId) return null;
  return state.goals.find(g => g.id === state.activeGoalId) || null;
});

export const useGoalsByCategory = () => useAppStore((state) => {
  const categories = ['Health', 'Work', 'Family', 'Personal'] as const;
  return categories.reduce((acc, category) => {
    acc[category] = state.goals.filter(g => g.category === category);
    return acc;
  }, {} as Record<string, GoalResponse[]>);
});

export const useWeeklyGoalsForGoal = (goalId: string) => useAppStore((state) => 
  state.weeklyGoals.filter(wg => wg.goalId === goalId).sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0))
);

export const useDailyTasksForWeeklyGoal = (weeklyGoalId: string) => useAppStore((state) =>
  state.dailyTasks.filter(task => task.weeklyGoalId === weeklyGoalId).sort((a, b) => (a.day || 0) - (b.day || 0))
);

export const useDailyTasksForGoal = (goalId: string) => useAppStore((state) =>
  state.dailyTasks.filter(task => task.goalId === goalId)
);
