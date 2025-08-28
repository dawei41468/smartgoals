import React from 'react';
import { Control, FieldValues, FieldPath } from 'react-hook-form';
import { Calendar } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TimeboundFieldProps<T extends FieldValues> {
  control: Control<T>;
  timeboundName: FieldPath<T>;
  deadlineName: FieldPath<T>;
}

const validateField = (value: string) => {
  if (value.length < 10) return "Could use more detail";
  if (value.length > 30) return "Good detail level";
  return "Basic information provided";
};

const getValidationIcon = (value: string) => {
  if (value.length < 10) return "⚠️";
  return "✅";
};

export function TimeboundField<T extends FieldValues>({ 
  control, 
  timeboundName, 
  deadlineName 
}: TimeboundFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={timeboundName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            <Calendar className="text-pink-500 mr-2 h-4 w-4" />
            Time-bound
          </FormLabel>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">When will you complete this goal? Set a specific deadline.</p>
          <div className="space-y-3">
            <FormField
              control={control}
              name={deadlineName}
              render={({ field: deadlineField }) => (
                <FormControl>
                  <Input 
                    {...deadlineField}
                    type="date"
                    data-testid="input-deadline"
                  />
                </FormControl>
              )}
            />
            <FormControl>
              <Textarea 
                {...field}
                className="resize-none"
                rows={2}
                placeholder="e.g., Complete development by October, testing by November, launch by December 31st..."
                data-testid="input-timebound"
              />
            </FormControl>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {getValidationIcon(field.value || '')} {validateField(field.value || '')}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
