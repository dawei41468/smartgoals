import React from 'react';
import { Control, FieldValues, FieldPath } from 'react-hook-form';
import { Folder } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

export function CategoryField<T extends FieldValues>({ control, name }: CategoryFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            <Folder className="text-secondary mr-2 h-4 w-4" />
            Goal Category
          </FormLabel>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Choose the area of your life this goal focuses on.</p>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Health">Health</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Family">Family</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
