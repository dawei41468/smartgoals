import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface GoalFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
}

export function GoalFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange
}: GoalFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-4 space-y-3">
      {/* Search Input - Full width on mobile */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t('myGoals.searchGoals')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full h-11 text-base"
          data-testid="input-search-goals"
        />
      </div>

      {/* Filter Controls - Optimized for mobile */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="flex-1 h-11 min-w-0" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-1 flex-shrink-0" />
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('myGoals.allStatus')}</SelectItem>
            <SelectItem value="active">{t('myGoals.active')}</SelectItem>
            <SelectItem value="completed">{t('myGoals.completed')}</SelectItem>
            <SelectItem value="paused">{t('myGoals.paused')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="flex-1 h-11 min-w-0" data-testid="select-sort-by">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">{t('myGoals.newest')}</SelectItem>
            <SelectItem value="deadline">{t('myGoals.deadline')}</SelectItem>
            <SelectItem value="progress">{t('myGoals.progress')}</SelectItem>
            <SelectItem value="title">{t('common.title')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
