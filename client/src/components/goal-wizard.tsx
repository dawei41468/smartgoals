import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Ruler, Mountain, Crosshair, Star } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { insertGoalSchema } from "@/lib/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { InsertGoal, AIBreakdownRequest, Goal, AIBreakdownResponse, UserSettings } from "@/lib/schema";
import { GoalService } from "@/services/goalService";
import StepIndicator from "@/components/shared/StepIndicator";
import { GoalWizardHeader } from "@/components/goal-wizard/GoalWizardHeader";
import { CategoryField } from "@/components/goal-wizard/CategoryField";
import { SMARTFormField } from "@/components/goal-wizard/SMARTFormField";
import { TimeboundField } from "@/components/goal-wizard/TimeboundField";
import { GenerationProgressIndicator } from "@/components/goal-wizard/GenerationProgressIndicator";
import { GoalWizardActionButtons } from "@/components/goal-wizard/GoalWizardActionButtons";

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
    mode: "onChange",
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

  // Enable Generate Breakdown when essential fields are filled (title not required here)
  const specific = form.watch("specific");
  const measurable = form.watch("measurable");
  const achievable = form.watch("achievable");
  const relevant = form.watch("relevant");
  const timebound = form.watch("timebound");
  const exciting = form.watch("exciting");
  const deadline = form.watch("deadline");
  const category = form.watch("category");

  const isGenerateEnabled = [
    specific,
    measurable,
    achievable,
    relevant,
    timebound,
    exciting,
    deadline,
    category,
  ].every((v) => typeof v === "string" ? v.trim().length > 0 : !!v);

  // Ensure title is auto-filled from 'specific' so schema validation passes on submit
  useEffect(() => {
    const spec = form.getValues("specific") || "";
    const currentTitle = form.getValues("title") || "";
    if (!currentTitle && spec.trim().length > 0) {
      const autoTitle = spec.substring(0, 50) + (spec.length > 50 ? "..." : "");
      form.setValue("title", autoTitle, { shouldValidate: true, shouldDirty: true });
    }
  }, [specific]);

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


  return (
    <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <GoalWizardHeader isEditing={!!editGoal} onClose={onClose} />
        
        <div className="mb-6 sm:mb-8">
          <StepIndicator 
            currentStep={1}
            steps={[
              { label: "SMART(ER) Setup", mobileLabel: "Setup" },
              { label: "AI Breakdown", mobileLabel: "AI" },
              { label: "Review & Save", mobileLabel: "Save" }
            ]}
          />
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
            <CategoryField control={form.control} name="category" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-6">
                <SMARTFormField
                  control={form.control}
                  name="specific"
                  label="Specific"
                  description="What exactly do you want to accomplish? Be clear and detailed."
                  placeholder="e.g., Launch a mobile fitness app with user authentication, workout tracking, and social features..."
                  icon={Target}
                  iconColor="text-secondary"
                  testId="input-specific"
                />

                <SMARTFormField
                  control={form.control}
                  name="measurable"
                  label="Measurable"
                  description="How will you track progress? What metrics will you use?"
                  placeholder="e.g., 1,000 registered users, 4.5+ app store rating, $5,000 monthly revenue..."
                  icon={Ruler}
                  iconColor="text-green-500"
                  testId="input-measurable"
                />

                <SMARTFormField
                  control={form.control}
                  name="achievable"
                  label="Achievable"
                  description="Is this goal realistic? What resources and skills do you have?"
                  placeholder="e.g., I have 5 years of React experience, $10,000 budget, and 20 hours/week to dedicate..."
                  icon={Mountain}
                  iconColor="text-blue-500"
                  testId="input-achievable"
                />
              </div>

              <div className="space-y-6">
                <SMARTFormField
                  control={form.control}
                  name="relevant"
                  label="Relevant"
                  description="Why is this goal important to you? How does it align with your values?"
                  placeholder="e.g., Aligns with my passion for health tech and career goal to become a mobile app entrepreneur..."
                  icon={Crosshair}
                  iconColor="text-purple-500"
                  testId="input-relevant"
                />

                <TimeboundField
                  control={form.control}
                  timeboundName="timebound"
                  deadlineName="deadline"
                />

                <SMARTFormField
                  control={form.control}
                  name="exciting"
                  label="Exciting & Rewarding"
                  description="What makes this goal exciting? How will you celebrate success?"
                  placeholder="e.g., Seeing users achieve their fitness goals using my app will be incredibly fulfilling..."
                  icon={Star}
                  iconColor="text-yellow-500"
                  testId="input-exciting"
                />
              </div>
            </div>

            <GenerationProgressIndicator
              isGenerating={generateBreakdownMutation.isPending}
              streamingProgress={streamingProgress}
            />

            <GoalWizardActionButtons
              onSaveDraft={onSaveDraft}
              saveDraftPending={saveDraftMutation.isPending}
              isGenerating={isGenerating}
              isFormValid={isGenerateEnabled}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
