import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";

interface FormFieldWithValidationProps {
  control: Control<any>;
  name: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  placeholder?: string;
  rows?: number;
  validateField?: (value: string) => string;
  getValidationIcon?: (value: string) => string;
  testId?: string;
}

export default function FormFieldWithValidation({
  control,
  name,
  label,
  icon: Icon,
  description,
  placeholder,
  rows = 4,
  validateField,
  getValidationIcon,
  testId
}: FormFieldWithValidationProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            {Icon && <Icon className="text-secondary mr-2 h-4 w-4" />}
            {label}
          </FormLabel>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
          )}
          <FormControl>
            <Textarea
              {...field}
              rows={rows}
              placeholder={placeholder}
              className="resize-none"
              data-testid={testId}
            />
          </FormControl>
          {validateField && getValidationIcon && field.value && (
            <div className="flex items-center mt-2 text-sm">
              <span className="mr-2">{getValidationIcon(field.value)}</span>
              <span className="text-gray-600 dark:text-gray-400">
                {validateField(field.value)}
              </span>
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
