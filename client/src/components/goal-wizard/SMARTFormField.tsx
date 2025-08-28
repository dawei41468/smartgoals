import React from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LucideIcon } from 'lucide-react';

interface SMARTFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description: string;
  placeholder: string;
  icon: LucideIcon;
  iconColor: string;
  type?: 'textarea' | 'input' | 'date';
  rows?: number;
  testId?: string;
  value?: string;
  showValidation?: boolean;
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

export function SMARTFormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  icon: Icon,
  iconColor,
  type = 'textarea',
  rows = 3,
  testId,
  showValidation = true,
}: SMARTFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            <Icon className={`${iconColor} mr-2 h-4 w-4`} />
            {label}
          </FormLabel>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
          <FormControl>
            {type === 'textarea' ? (
              <Textarea 
                {...field}
                className="resize-none"
                rows={rows}
                placeholder={placeholder}
                data-testid={testId}
              />
            ) : type === 'date' ? (
              <Input 
                {...field}
                type="date"
                data-testid={testId}
              />
            ) : (
              <Input 
                {...field}
                placeholder={placeholder}
                data-testid={testId}
              />
            )}
          </FormControl>
          {showValidation && type === 'textarea' && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {getValidationIcon(field.value || '')} {validateField(field.value || '')}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
