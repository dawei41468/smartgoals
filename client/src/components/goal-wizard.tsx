import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Target, Ruler, Mountain, Crosshair, Calendar, Star, ArrowRight, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { insertGoalSchema } from "@/lib/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { InsertGoal, AIBreakdownRequest, Goal, AIBreakdownResponse, UserSettings } from "@/lib/schema";
import { GoalService } from "@/services/goalService";

interface GoalWizardProps {
  onClose: () => void;
  onProceedToBreakdown: (goalData: InsertGoal, breakdownData: AIBreakdownRequest, breakdown: AIBreakdownResponse) => void;
  editGoal?: Goal;
}

export default function GoalWizard({ onClose, onProceedToBreakdown, editGoal }: GoalWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch user settings to get default goal duration
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ["/api/user/settings"],
    enabled: !!user,
  });
  
  // Calculate default deadline based on user preference
  const getDefaultDeadline = () => {
    if (editGoal?.deadline) return editGoal.deadline;
    
    const defaultDuration = (userSettings as UserSettings)?.defaultGoalDuration || "3-months";
    const today = new Date();
    
    switch (defaultDuration) {
      case "1-month":
        today.setMonth(today.getMonth() + 1);
        break;
      case "3-months":
        today.setMonth(today.getMonth() + 3);
        break;
      case "6-months":
        today.setMonth(today.getMonth() + 6);
        break;
      case "1-year":
        today.setFullYear(today.getFullYear() + 1);
        break;
      default:
        today.setMonth(today.getMonth() + 3);
    }
    
    return today.toISOString().split('T')[0];
  };
  
  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: editGoal ? {
      title: editGoal.title || "",
      description: editGoal.description || "",
      category: editGoal.category,
      specific: editGoal.specific,
      measurable: editGoal.measurable,
      achievable: editGoal.achievable,
      relevant: editGoal.relevant,
      timebound: editGoal.timebound,
      exciting: editGoal.exciting,
      deadline: editGoal.deadline,
    } : {
      title: "",
      description: "",
      category: "Health" as const,
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timebound: "",
      exciting: "",
      deadline: getDefaultDeadline(),
    },
  });

  const onSaveDraft = async () => {
    const values = form.getValues();
    const goalData: InsertGoal = {
      ...values,
      title: values.title || values.specific.substring(0, 50) + (values.specific.length > 50 ? "..." : ""),
      description: values.description || values.specific,
    };
    await saveDraftMutation.mutateAsync(goalData);
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (goalData: InsertGoal) => {
      return GoalService.createGoalDraft(goalData);
    },
    onSuccess: (goal) => {
      toast({
        title: "Draft saved",
        description: `Saved draft goal: ${goal.title}`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
      console.error("Save draft error:", error);
    },
  });

  const [streamingProgress, setStreamingProgress] = useState<{
    message: string;
    currentChunk: number;
    totalChunks: number;
    partialWeeks: any[];
  }>({
    message: "",
    currentChunk: 0,
    totalChunks: 0,
    partialWeeks: [],
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

      // Reset streaming state
      setStreamingProgress({
        message: "",
        currentChunk: 0,
        totalChunks: 0,
        partialWeeks: [],
      });

      return GoalService.generateBreakdownStream(
        breakdownRequest,
        (message: string, currentChunk: number, totalChunks: number) => {
          setStreamingProgress(prev => ({
            ...prev,
            message,
            currentChunk,
            totalChunks,
          }));
        },
        (weeks: any) => {
          setStreamingProgress(prev => ({
            ...prev,
            partialWeeks: [...prev.partialWeeks, ...weeks],
          }));
        }
      );
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
      console.log("Breakdown generation successful:", breakdown);
      onProceedToBreakdown(goalData, breakdownRequest, breakdown);
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
    console.log("Form submitted with values:", values);
    
    // Generate title from specific field if not provided
    const goalData = {
      ...values,
      title: values.title || values.specific.substring(0, 50) + (values.specific.length > 50 ? "..." : ""),
      description: values.description || values.specific,
    };

    console.log("Processed goal data:", goalData);
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
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editGoal ? "Edit Your SMART(ER) Goal" : "Create Your SMART(ER) Goal"}
          </h1>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-wizard">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile compact version */}
          <div className="flex items-center justify-between sm:hidden px-2">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
              <span className="ml-1 text-xs font-medium text-primary">Setup</span>
            </div>
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">AI</span>
            </div>
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">3</div>
              <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">Save</span>
            </div>
          </div>
          
          {/* Desktop version */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center flex-shrink-0">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <span className="ml-2 text-sm font-medium text-primary whitespace-nowrap">SMART(ER) Setup</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700 min-w-4"></div>
            <div className="flex items-center flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">AI Breakdown</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700 min-w-4"></div>
            <div className="flex items-center flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Review & Save</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors);
            toast({
              title: "Form Validation Error",
              description: "Please fill in all required fields completely.",
              variant: "destructive",
            });
          })} className="space-y-6">
            {/* Category Field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <Folder className="text-secondary mr-2 h-4 w-4" />
                    Goal Category
                  </FormLabel>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Choose the area of your life this goal focuses on.</p>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-6">
                {/* Specific */}
                <FormField
                  control={form.control}
                  name="specific"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Target className="text-secondary mr-2 h-4 w-4" />
                        Specific
                      </FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">What exactly do you want to accomplish? Be clear and detailed.</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., Launch a mobile fitness app with user authentication, workout tracking, and social features..."
                          data-testid="input-specific"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
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
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Ruler className="text-secondary mr-2 h-4 w-4" />
                        Measurable
                      </FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">How will you track progress and know when you've achieved your goal?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., App published on both iOS and Android app stores with 1000+ downloads..."
                          data-testid="input-measurable"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
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
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Mountain className="text-accent mr-2 h-4 w-4" />
                        Achievable
                      </FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Is this goal realistic given your resources, skills, and timeframe?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., I have 3 years of React Native experience and $5000 budget for development tools..."
                          data-testid="input-achievable"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
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
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Crosshair className="text-purple-500 mr-2 h-4 w-4" />
                        Relevant
                      </FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Why is this goal important to you? How does it align with your values?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., Aligns with my passion for health tech and career goal to become a mobile app entrepreneur..."
                          data-testid="input-relevant"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
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
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Calendar className="text-pink-500 mr-2 h-4 w-4" />
                        Time-bound
                      </FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">When will you complete this goal? Set a specific deadline.</p>
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
                      <div className="text-xs text-gray-600 dark:text-gray-400">
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
                      <FormLabel className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Star className="text-yellow-500 mr-2 h-4 w-4" />
                        Exciting & Rewarding
                      </FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">What makes this goal exciting? How will you celebrate success?</p>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="resize-none"
                          rows={3}
                          placeholder="e.g., Seeing users achieve their fitness goals using my app will be incredibly fulfilling..."
                          data-testid="input-exciting"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {getValidationIcon(field.value)} {validateField(field.value)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Progress Indicator */}
            {generateBreakdownMutation.isPending && (
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
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={saveDraftMutation.isPending}
                className="flex-1 text-sm"
              >
                {saveDraftMutation.isPending ? t('common.loading') : t('goalWizard.saveDraft')}
              </Button>
              <Button
                type="submit"
                disabled={isGenerating || !form.formState.isValid}
                className="flex-1 text-sm"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('goalWizard.generating')}
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('goalWizard.generateBreakdown')}</span>
                    <span className="sm:hidden">{t('goalWizard.generateBreakdownMobile')}</span>
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
