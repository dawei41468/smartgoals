import React from "react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getPriorityColor } from "@/lib/goalUtils";

interface StatusBadgeProps {
  status: string | null | undefined;
  type?: "status" | "priority";
  className?: string;
}

export default function StatusBadge({ status, type = "status", className }: StatusBadgeProps) {
  const colorClasses = type === "status" 
    ? getStatusColor(status)
    : getPriorityColor(status);

  const displayText = status 
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Unknown";

  return (
    <Badge 
      className={`${colorClasses} ${className || ""}`}
      variant="outline"
    >
      {displayText}
    </Badge>
  );
}
