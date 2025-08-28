import React from 'react';

interface StatusLegendItemProps {
  color: string;
  label: string;
  count: number;
  total: number;
  showPercentage?: boolean;
}

export function StatusLegendItem({ 
  color, 
  label, 
  count, 
  total, 
  showPercentage = true 
}: StatusLegendItemProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 ${color} rounded-full`}></div>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{count}</span>
        {showPercentage && (
          <span className="text-xs text-gray-500">({percentage}%)</span>
        )}
      </div>
    </div>
  );
}
