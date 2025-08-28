# Store & Selectors Reference

## Store Structure

### Core State

```typescript
interface UIState {
  currentView: ViewType;           // 'dashboard' | 'wizard' | 'breakdown'
  isLoading: boolean;              // Global loading state
  sidebarOpen: boolean;            // Sidebar visibility
  activeGoalId: string | null;     // Currently selected goal
}

interface DataState {
  // Core entities
  goals: GoalResponse[];
  activities: ActivityResponse[];
  stats: StatsResponse | null;
  
  // Analytics data
  analyticsSummary: AnalyticsSummaryResponse | null;
  categoryPerformance: CategoryPerformanceResponse[];
  productivityPatterns: ProductivityPatternResponse[];
  
  // Progress data
  progressStats: ProgressStats | null;
  achievements: Achievement[];
}
```

### Data Types

```typescript
// Progress Stats
interface ProgressStats {
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

// Achievement
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}
```

## Available Selectors

### Core Selectors

```typescript
// Basic data access
const goals = useGoals();                    // GoalResponse[]
const activities = useActivities();          // ActivityResponse[]
const stats = useStats();                    // StatsResponse | null

// UI state
const currentView = useCurrentView();        // ViewType
const isLoading = useIsLoading();           // boolean
const activeGoalId = useActiveGoalId();     // string | null
```

### Analytics Selectors

```typescript
// Analytics data
const analyticsSummary = useAnalyticsSummary();           // AnalyticsSummaryResponse | null
const categoryPerformance = useCategoryPerformance();     // CategoryPerformanceResponse[]
const productivityPatterns = useProductivityPatterns();   // ProductivityPatternResponse[]
```

### Progress Selectors

```typescript
// Progress tracking
const progressStats = useProgressStats();    // ProgressStats | null
const achievements = useAchievements();       // Achievement[]
```

### Computed Selectors

```typescript
// Active goal
const activeGoal = useActiveGoal();          // GoalResponse | null

// Goals by category
const goalsByCategory = useGoalsByCategory(); // Record<string, GoalResponse[]>

// Goal statistics
const goalStats = useGoalStats();            // { total, active, completed, completionRate }
```

## Store Actions

### UI Actions

```typescript
// View management
useAppStore.getState().setCurrentView('dashboard');
useAppStore.getState().setLoading(true);
useAppStore.getState().setSidebarOpen(false);
useAppStore.getState().setActiveGoalId('goal-123');
```

### Data Actions

```typescript
// Goals
useAppStore.getState().setGoals(goals);
useAppStore.getState().addGoal(newGoal);
useAppStore.getState().updateGoal('goal-id', updates);
useAppStore.getState().removeGoal('goal-id');

// Activities
useAppStore.getState().setActivities(activities);
useAppStore.getState().addActivity(newActivity);

// Stats
useAppStore.getState().setStats(statsData);

// Analytics
useAppStore.getState().setAnalyticsSummary(summary);
useAppStore.getState().setCategoryPerformance(categories);
useAppStore.getState().setProductivityPatterns(patterns);

// Progress
useAppStore.getState().setProgressStats(stats);
useAppStore.getState().setAchievements(achievements);
```

## Usage Examples

### Basic Component Pattern

```typescript
import { useGoals, useIsLoading } from '@/stores/appStore';
import { GoalService } from '@/services/goalService';

function MyComponent() {
  const goals = useGoals();
  const isLoading = useIsLoading();
  
  useEffect(() => {
    GoalService.fetchGoals();
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {goals.map(goal => (
        <div key={goal.id}>{goal.title}</div>
      ))}
    </div>
  );
}
```

### Analytics Page Pattern

```typescript
import { 
  useAnalyticsSummary, 
  useCategoryPerformance, 
  useProductivityPatterns,
  useIsLoading 
} from '@/stores/appStore';
import { StatsService } from '@/services/statsService';

function AnalyticsPage() {
  const analyticsSummary = useAnalyticsSummary();
  const categoryPerformance = useCategoryPerformance();
  const productivityPatterns = useProductivityPatterns();
  const isLoading = useIsLoading();
  
  useEffect(() => {
    StatsService.fetchAllAnalyticsData();
  }, []);
  
  // Use data directly from store
  return (
    <div>
      <h1>Success Rate: {analyticsSummary?.goalSuccessRate}%</h1>
      {categoryPerformance.map(category => (
        <div key={category.name}>{category.name}: {category.successRate}%</div>
      ))}
    </div>
  );
}
```

### Progress Page Pattern

```typescript
import { useProgressStats, useAchievements, useIsLoading } from '@/stores/appStore';
import { ProgressService } from '@/services/progressService';

function ProgressPage() {
  const progressStats = useProgressStats();
  const achievements = useAchievements();
  const isLoading = useIsLoading();
  
  useEffect(() => {
    ProgressService.fetchAllProgressData();
  }, []);
  
  // Fallback data pattern
  const safeStats = progressStats || {
    totalGoals: 0,
    completedGoals: 0,
    currentStreak: 0,
    // ... other defaults
  };
  
  return (
    <div>
      <h1>Current Streak: {safeStats.currentStreak} days</h1>
      {achievements.map(achievement => (
        <div key={achievement.id}>{achievement.title}</div>
      ))}
    </div>
  );
}
```

## Best Practices

### Selector Usage

```typescript
// ✅ Good - Use specific selectors
const goals = useGoals();
const isLoading = useIsLoading();

// ❌ Avoid - Don't access store directly in components
const store = useAppStore();
```

### Data Updates

```typescript
// ✅ Good - Use services for data operations
await GoalService.createGoal(goalData);

// ❌ Avoid - Don't update store directly in components
useAppStore.getState().addGoal(newGoal);
```

### Loading States

```typescript
// ✅ Good - Services handle loading states
useEffect(() => {
  const fetchData = async () => {
    try {
      await SomeService.fetchData();
    } catch (error) {
      // Handle error
    }
  };
  fetchData();
}, []);

// ❌ Avoid - Manual loading state management
const [loading, setLoading] = useState(false);
```

### Error Handling

```typescript
// ✅ Good - Let services handle errors and fallbacks
const data = useSelector();
const displayData = data || fallbackData;

// ❌ Avoid - Complex error handling in components
const [error, setError] = useState(null);
```

## Performance Tips

### Selective Subscriptions

```typescript
// ✅ Good - Only subscribe to needed data
const goalCount = useAppStore(state => state.goals.length);

// ❌ Avoid - Subscribing to entire store
const store = useAppStore();
const goalCount = store.goals.length;
```

### Computed Values

```typescript
// ✅ Good - Use computed selectors
const goalStats = useGoalStats();

// ❌ Avoid - Computing in component
const goals = useGoals();
const completionRate = goals.length > 0 ? (completed / goals.length) * 100 : 0;
```

---

**Last Updated**: August 28, 2025
