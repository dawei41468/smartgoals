# SmartGoals Architecture Documentation

## Overview

SmartGoals follows a **Store + Services** architecture pattern for consistent data management across the entire application. This document outlines the current architecture, patterns, and best practices.

## Frontend Architecture

### Store + Services Pattern

The application uses a unified data fetching pattern that combines:
- **Zustand Store**: Centralized state management
- **Service Layer**: Business logic abstraction with automatic store updates
- **Selectors**: Optimized data access with selective subscriptions

### Store Structure (`/client/src/stores/appStore.ts`)

#### State Types

```typescript
// UI State
interface UIState {
  currentView: ViewType;
  isLoading: boolean;
  sidebarOpen: boolean;
  activeGoalId: string | null;
}

// Data State
interface DataState {
  // Core data
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

#### Key Selectors

```typescript
// Core selectors
export const useGoals = () => useAppStore((state) => state.goals);
export const useIsLoading = () => useAppStore((state) => state.isLoading);

// Analytics selectors
export const useAnalyticsSummary = () => useAppStore((state) => state.analyticsSummary);
export const useCategoryPerformance = () => useAppStore((state) => state.categoryPerformance);
export const useProductivityPatterns = () => useAppStore((state) => state.productivityPatterns);

// Progress selectors
export const useProgressStats = () => useAppStore((state) => state.progressStats);
export const useAchievements = () => useAppStore((state) => state.achievements);

// Computed selectors
export const useGoalStats = () => useAppStore((state) => {
  const total = state.goals.length;
  const active = state.goals.filter(g => g.status === 'active').length;
  const completed = state.goals.filter(g => g.status === 'completed').length;
  return { total, active, completed, completionRate: total > 0 ? (completed / total) * 100 : 0 };
});
```

### Service Layer

#### GoalService (`/client/src/services/goalService.ts`)

Handles all goal-related operations with automatic store updates:

```typescript
export class GoalService {
  // Fetches goals and updates store
  static async fetchGoals(): Promise<GoalResponse[]>
  static async fetchDetailedGoals(): Promise<GoalWithBreakdownResponse[]>
  
  // CRUD operations with store updates
  static async createGoal(data: CreateGoalRequest): Promise<GoalResponse>
  static async updateGoal(id: string, updates: UpdateGoalRequest): Promise<GoalResponse>
  static async deleteGoal(id: string): Promise<void>
  
  // AI integration
  static async generateBreakdown(request: AIBreakdownRequest): Promise<AIBreakdownResponse>
  static async saveCompleteGoal(goalData: CreateGoalRequest, breakdown: AIBreakdownResponse): Promise<GoalWithBreakdownResponse>
}
```

#### StatsService (`/client/src/services/statsService.ts`)

Manages analytics and statistics data:

```typescript
export class StatsService {
  // Dashboard stats
  static async fetchStats(): Promise<StatsResponse>
  
  // Analytics data with store updates
  static async fetchAnalyticsSummary(): Promise<AnalyticsSummaryResponse>
  static async fetchCategoryPerformance(): Promise<CategoryPerformanceResponse[]>
  static async fetchProductivityPatterns(): Promise<ProductivityPatternResponse[]>
  
  // Batch operations
  static async fetchAllAnalyticsData(): Promise<void>
}
```

#### ProgressService (`/client/src/services/progressService.ts`)

Handles progress tracking and achievements:

```typescript
export class ProgressService {
  // Progress data with store updates
  static async fetchProgressStats(): Promise<ProgressStats>
  static async fetchAchievements(): Promise<Achievement[]>
  
  // Batch operations
  static async fetchAllProgressData(): Promise<void>
  
  // Utility functions
  static generateMockAchievements(progressStats: ProgressStats | null): Achievement[]
}
```

### Page Architecture

#### Data Pages Pattern

All data-heavy pages follow this consistent pattern:

```typescript
function PageComponent() {
  // 1. Get data from store via selectors
  const data = useStoreSelector();
  const isLoading = useIsLoading();
  
  // 2. Fetch data on mount using services
  useEffect(() => {
    const fetchData = async () => {
      try {
        await SomeService.fetchAllData();
      } catch (error) {
        // Handle error with toast
      }
    };
    fetchData();
  }, []);
  
  // 3. Use data directly from store
  return <div>{/* Render using store data */}</div>;
}
```

#### Pages Using Store + Services

- **analytics.tsx**: Uses `StatsService.fetchAllAnalyticsData()`
- **progress.tsx**: Uses `ProgressService.fetchAllProgressData()`
- **my-goals.tsx**: Uses `GoalService.fetchDetailedGoals()`
- **dashboard.tsx**: Uses multiple services for comprehensive data

#### Pages Using React Query

React Query is preserved for specific use cases:
- **Auth pages** (`login.tsx`, `register.tsx`): One-off authentication operations
- **Settings page**: User preference updates

### Error Handling & Fallbacks

#### Service Layer Error Handling

All services implement consistent error handling:

```typescript
static async fetchData(): Promise<DataType> {
  try {
    const response = await apiRequest('GET', '/api/endpoint');
    const data = await response.json();
    
    // Update store with successful data
    useAppStore.getState().setData(data);
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    
    // Set fallback data in store
    const fallbackData = { /* fallback values */ };
    useAppStore.getState().setData(fallbackData);
    
    throw error;
  }
}
```

#### Loading States

Centralized loading management through the store:

```typescript
// Services automatically manage loading states
static async someOperation() {
  try {
    useAppStore.getState().setLoading(true);
    // ... perform operation
  } finally {
    useAppStore.getState().setLoading(false);
  }
}
```

## Benefits of Current Architecture

### Performance
- **Selective Subscriptions**: Components only re-render when their specific data changes
- **Batch Operations**: Services can fetch multiple data types in parallel
- **Centralized Caching**: Store maintains data between page navigations

### Maintainability
- **Single Source of Truth**: All data flows through the store
- **Consistent Patterns**: Same data fetching pattern across all pages
- **Type Safety**: Full TypeScript support throughout the stack

### Developer Experience
- **Predictable Data Flow**: Store → Services → Components
- **Easy Testing**: Services can be unit tested independently
- **Clear Separation**: UI logic separate from business logic

## Best Practices

### When to Use Store + Services
- Data that needs to be shared across components
- Complex data transformations
- Data that requires caching
- Analytics and dashboard data

### When to Use React Query
- One-off operations (auth, settings)
- Operations that don't need global state
- Simple CRUD operations that don't affect other components

### Service Implementation Guidelines

1. **Always update store**: Services should automatically update the store
2. **Handle errors gracefully**: Provide fallback data when possible
3. **Use TypeScript**: Maintain type safety throughout
4. **Batch operations**: Group related API calls when possible
5. **Loading states**: Manage loading states consistently

### Store Guidelines

1. **Use selectors**: Create specific selectors for data access
2. **Avoid direct mutations**: Use store actions for all updates
3. **Keep it normalized**: Store data in a normalized format
4. **Persist wisely**: Only persist UI preferences, not data

## Migration Guide

### From React Query to Store + Services

1. **Identify the data**: Determine what data needs to be in the store
2. **Create store state**: Add new state properties and actions
3. **Create/enhance service**: Build service methods with store updates
4. **Update component**: Replace `useQuery` with store selectors
5. **Remove unused imports**: Clean up React Query imports

### Example Migration

```typescript
// Before (React Query)
const { data, isLoading } = useQuery({
  queryKey: ['analytics'],
  queryFn: () => apiRequest('GET', '/api/analytics')
});

// After (Store + Services)
const analyticsData = useAnalyticsSummary();
const isLoading = useIsLoading();

useEffect(() => {
  StatsService.fetchAnalyticsSummary();
}, []);
```

## Future Considerations

### Potential Enhancements
- **Real-time Updates**: WebSocket integration with store updates
- **Optimistic Updates**: Implement optimistic UI updates
- **Data Persistence**: Selective data persistence for offline support
- **Advanced Caching**: Implement TTL-based cache invalidation

### Scalability
- **Code Splitting**: Services can be lazy-loaded if needed
- **Store Modules**: Split store into modules as the app grows
- **Background Sync**: Implement background data synchronization

---

**Last Updated**: August 28, 2025
**Architecture Version**: 1.1.0 - Store + Services Pattern
