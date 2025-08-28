import React from 'react';
import { Progress as ProgressBar } from '@/components/ui/progress';

interface ProgressWithLabelProps {
  label: string;
  value: number;
  showPercentage?: boolean;
  labelWidth?: string;
  valueWidth?: string;
  className?: string;
}

export function ProgressWithLabel({ 
  label, 
  value, 
  showPercentage = true, 
  labelWidth = "w-20",
  valueWidth = "w-16",
  className = ""
}: ProgressWithLabelProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className={`text-sm font-medium ${labelWidth}`}>{label}</span>
      <ProgressBar value={value} className="flex-1" />
      {showPercentage && (
        <span className={`text-sm text-gray-600 ${valueWidth}`}>
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
