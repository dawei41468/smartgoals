import React from "react";

interface StepData {
  label: string;
  mobileLabel?: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: StepData[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile compact version */}
      <div className="flex items-center justify-between sm:hidden px-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isActive || isCompleted 
                    ? "bg-primary text-white" 
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                }`}>
                  {stepNumber}
                </div>
                <span className={`ml-1 text-xs font-medium ${
                  isActive || isCompleted
                    ? "text-primary" 
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {step.mobileLabel || step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 dark:bg-gray-700"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Desktop version */}
      <div className="hidden sm:flex items-center space-x-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className="flex items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isActive || isCompleted 
                    ? "bg-primary text-white" 
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                }`}>
                  {stepNumber}
                </div>
                <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
                  isActive || isCompleted
                    ? "text-primary" 
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700 min-w-4"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
