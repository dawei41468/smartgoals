import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";

interface ProgressData {
  label: string;
  value: number;
  total: number;
  color?: string;
}

interface ProgressChartProps {
  title: string;
  description?: string;
  data: ProgressData[];
  className?: string;
}

export default function ProgressChart({ title, description, data, className }: ProgressChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => {
          const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {item.value}/{item.total} ({Math.round(percentage)}%)
                </span>
              </div>
              <ProgressBar 
                value={percentage} 
                className="h-2"
                style={item.color ? { '--progress-foreground': item.color } as React.CSSProperties : undefined}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
