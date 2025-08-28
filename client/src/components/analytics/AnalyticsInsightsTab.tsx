import React from 'react';
import { Brain, Lightbulb, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStatusColor, getPriorityColor } from '@/lib/goalUtils';

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  actionable: boolean;
}

interface AnalyticsInsightsTabProps {
  insights: Insight[];
}

export function AnalyticsInsightsTab({ insights }: AnalyticsInsightsTabProps) {
  const { t } = useLanguage();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return getStatusColor('completed');
      case 'warning':
        return getPriorityColor('high');
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5" />
          {t('analytics.aiPoweredInsights')}
        </CardTitle>
        <CardDescription>
          {t('analytics.personalizedRecommendations')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge className={getInsightBadgeColor(insight.type)}>
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Apply Suggestion
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
