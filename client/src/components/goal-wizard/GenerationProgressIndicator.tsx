import React from 'react';

interface StreamingProgress {
  message: string;
  currentChunk: number;
  totalChunks: number;
  partialWeeks: any[];
}

interface GenerationProgressIndicatorProps {
  isGenerating: boolean;
  streamingProgress: StreamingProgress;
}

export function GenerationProgressIndicator({ 
  isGenerating, 
  streamingProgress 
}: GenerationProgressIndicatorProps) {
  if (!isGenerating) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {streamingProgress.message || "Starting generation..."}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-blue-700 dark:text-blue-300">
            {streamingProgress.totalChunks > 0 && streamingProgress.currentChunk > 0 && (
              <span>
                Chunk {streamingProgress.currentChunk} of {streamingProgress.totalChunks}
              </span>
            )}
            {streamingProgress.partialWeeks.length > 0 && (
              <span>
                {streamingProgress.partialWeeks.length} weeks completed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
