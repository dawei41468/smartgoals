import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { ErrorHandler } from '@/lib/errorHandling';
import type { ActivityResponse } from '@/lib/types';

export class ActivityService {
  /**
   * Fetch activities and update store
   */
  static async fetchActivities(limit?: number): Promise<ActivityResponse[]> {
    try {
      useAppStore.getState().setLoading(true);
      const activities = await api.getActivities(limit);
      useAppStore.getState().setActivities(activities);
      return activities;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'fetch activities',
        entityType: 'Activity'
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Add activity to store (for real-time updates)
   */
  static addActivity(activity: ActivityResponse): void {
    useAppStore.getState().addActivity(activity);
  }
}
