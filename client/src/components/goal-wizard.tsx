import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X, Target, Ruler, Mountain, Crosshair, Calendar, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { insertGoalSchema } from "@shared/schema";
import type { InsertGoal, AIBreakdownRequest } from "@shared/schema";
import { api } from "@/lib/api";

interface GoalWizardProps {
  onClose: () => void;
  onProceedToBreakdown: (goalData: InsertGoal, breakdownData: AIBreakdownRequest) => void;
}

export default function GoalWizard({ onClose, onProceedToBreakdown }: GoalWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timebound: "",
      exciting: "",
      deadline: "",
    },
  });

  const generateBreakdownMutation = useMutation({
    mutationFn: async (goalData: InsertGoal) => {
      const breakdownRequest: AIBreakdownRequest = {
        specific: goalData.specific,
        measurable: goalData.measurable,
        achievable: goalData.achievable,
        relevant: goalData.relevant,
        timebound: goalData.timebound,
        exciting: goalData.exciting,
        deadline: goalData.deadline,
      };
      
      return api.generateBreakdown(breakdownRequest);
    },
    onSuccess: (breakdown, goalData) => {
      const breakdownRequest: AIBreakdownRequest = {
        specific: goalData.specific,
        measurable: goalData.measurable,
        achievable: goalData.achievable,
        relevant: goalData.relevant,
        timebound: goalData.timebound,
        exciting: goalData.exciting,
        deadline: goalData.deadline,
      };
      onProceedToBreakdown(goalData, breakdownRequest);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate goal breakdown. Please try again.",
        variant: "destructive",
      });
      console.error("Breakdown generation error:", error);
    },
  });

  const onSubmit = async (values: InsertGoal) => {
    // Generate title from specific field if not provided
    const goalData = {
      ...values,
      title: values.title || values.specific.substring(0, 50) + (values.specific.length > 50 ? "..." : ""),
      description: values.description || values.specific,
    };

    setIsGenerating(true);
    try {
      await generateBreakdownMutation.mutateAsync(goalData);
    } finally {
      setIsGenerating(false);
    }
  };

  const validateField = (value: string) => {
    if (value.length < 10) return "Could use more detail";
    if (value.length > 30) return "Good detail level";
    return "Basic information provided";
  };

  const getValidationIcon = (value: string) => {
    if (value.length < 10) return "⚠️";
    return "✅";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Your SMART(ER) Goal</h1>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-wizard">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
            <span className="ml-2 text-sm font-medium text-primary">SMART(ER) Setup</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
            <span className="ml-2 text-sm font-medium text-gray-500">AI Breakdown</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
            <span className="ml-2 text-sm font-medium text-gray-500">Review & Save</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Specific */}
                <FormField
                  control={form.control}
                  name="specific"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                        <Target className="text-primary mr-2 h-4 w-4" />
                        Specific
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-3">What exactly do you want to accomplish? Be clear and detailed.</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., Launch a mobile fitness app with user authentication, workout tracking, and social features..."
                          data-testid="input-specific"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600">
                        {getValidationIcon(field.value)} {validateField(field.value)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Measurable */}
                <FormField
                  control={form.control}
                  name="measurable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                        <Ruler className="text-secondary mr-2 h-4 w-4" />
                        Measurable
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-3">How will you track progress and know when you've achieved your goal?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., App published on both iOS and Android app stores with 1000+ downloads..."
                          data-testid="input-measurable"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600">
                        {getValidationIcon(field.value)} {validateField(field.value)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Achievable */}
                <FormField
                  control={form.control}
                  name="achievable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                        <Mountain className="text-accent mr-2 h-4 w-4" />
                        Achievable
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-3">Is this goal realistic given your resources, skills, and timeframe?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., I have 3 years of React Native experience and $5000 budget for development tools..."
                          data-testid="input-achievable"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600">
                        {getValidationIcon(field.value)} {validateField(field.value)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                {/* Relevant */}
                <FormField
                  control={form.control}
                  name="relevant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                        <Crosshair className="text-purple-500 mr-2 h-4 w-4" />
                        Relevant
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-3">Why is this goal important to you? How does it align with your values?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., Aligns with my passion for health tech and career goal to become a mobile app entrepreneur..."
                          data-testid="input-relevant"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600">
                        {getValidationIcon(field.value)} {validateField(field.value)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time-bound */}
                <FormField
                  control={form.control}
                  name="timebound"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                        <Calendar className="text-pink-500 mr-2 h-4 w-4" />
                        Time-bound
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-3">When will you complete this goal? Set a specific deadline.</p>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="deadline"
                          render={({ field: deadlineField }) => (
                            <FormControl>
                              <Input 
                                {...deadlineField}
                                type="date"
                                data-testid="input-deadline"
                              />
                            </FormControl>
                          )}
                        />
                        <FormControl>
                          <Textarea 
                            {...field}
                            className="resize-none"
                            rows={2}
                            placeholder="e.g., Complete development by October, testing by November, launch by December 31st..."
                            data-testid="input-timebound"
                          />
                        </FormControl>
                      </div>
                      <div className="text-xs text-gray-600">
                        {getValidationIcon(field.value)} {validateField(field.value)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Exciting & Rewarding */}
                <FormField
                  control={form.control}
                  name="exciting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700">
                        <Star className="text-yellow-500 mr-2 h-4 w-4" />
                        Exciting & Rewarding
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-3">What makes this goal exciting? How will you celebrate success?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., Seeing users achieve their fitness goals using my app will be incredibly fulfilling..."
                          data-testid="input-exciting"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600">
                        {getValidationIcon(field.value)} {validateField(field.value)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" data-testid="button-save-draft">
                Save as Draft
              </Button>
              <Button 
                type="submit" 
                disabled={isGenerating}
                data-testid="button-generate-breakdown"
              >
                {isGenerating ? (
                  "Generating..."
                ) : (
                  <>
                    Generate AI Breakdown <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
