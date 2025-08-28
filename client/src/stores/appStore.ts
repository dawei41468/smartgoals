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
  sidebarOpen: boolean;
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
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

// Data State Types
export interface DataState {
  goals: GoalResponse[];
  activities: ActivityResponse[];
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
  setSidebarOpen: (open: boolean) => void;
  setActiveGoalId: (id: string | null) => void;
  
  // Goal Actions
  setGoals: (goals: GoalResponse[]) => void;
  addGoal: (goal: GoalResponse) => void;
  updateGoal: (id: string, updates: Partial<GoalResponse>) => void;
  removeGoal: (id: string) => void;
  
  // Activity Actions
  setActivities: (activities: ActivityResponse[]) => void;
  addActivity: (activity: ActivityResponse) => void;
  
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
  sidebarOpen: false,
  activeGoalId: null,
  
  // Data State
  goals: [],
  activities: [],
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
        setSidebarOpen: (open) => set({ sidebarOpen: open }, false, 'setSidebarOpen'),
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
          sidebarOpen: state.sidebarOpen,
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

export const useGoalStats = () => useAppStore((state) => {
  const total = state.goals.length;
  const active = state.goals.filter(g => g.status === 'active').length;
  const completed = state.goals.filter(g => g.status === 'completed').length;
  const paused = state.goals.filter(g => g.status === 'paused').length;
  
  return {
    total,
    active,
    completed,
    paused,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
});
