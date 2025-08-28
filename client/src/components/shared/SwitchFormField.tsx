import React from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";

interface SwitchFormFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  description: string;
  testId?: string;
}

export default function SwitchFormField({
  control,
  name,
  label,
  description,
  testId
}: SwitchFormFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              data-testid={testId}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
