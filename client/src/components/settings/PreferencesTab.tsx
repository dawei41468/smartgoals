import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { UpdateUserSettings, UserSettings } from "@/lib/schema";

const preferencesSchema = z.object({
  defaultGoalDuration: z.string(),
  aiBreakdownDetail: z.string(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function PreferencesTab() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Fetch user settings data only when authenticated
  const { data: userSettings } = useQuery({
    queryKey: ["/api/user/settings"],
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultGoalDuration: "3-months",
      aiBreakdownDetail: "detailed",
    },
  });

  // Update form values when settings data loads
  React.useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      const us = userSettings as Partial<UserSettings>;
      preferencesForm.reset({
        defaultGoalDuration: us.defaultGoalDuration || "3-months",
        aiBreakdownDetail: us.aiBreakdownDetail || "detailed",
      });
    }
  }, [userSettings, preferencesForm]);

  // Settings update mutation
  const settingsMutation = useMutation({
    mutationFn: (data: UpdateUserSettings) => 
      apiRequest("PATCH", "/api/user/settings", data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: t("settings.messages.settingsUpdated"),
        description: t("settings.messages.settingsSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("settings.messages.updateFailed"),
        description: error.message || t("settings.messages.updateFailed"),
        variant: "destructive",
      });
    },
  });

  const onPreferencesSubmit = async (data: PreferencesFormData) => {
    settingsMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.preferences.title")}</CardTitle>
        <CardDescription>
          {t("settings.preferences.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...preferencesForm}>
          <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
            <FormField
              control={preferencesForm.control}
              name="defaultGoalDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.preferences.defaultGoalDuration")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-goal-duration">
                        <SelectValue placeholder="Select default duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-month">{t("settings.preferences.durations.oneMonth")}</SelectItem>
                      <SelectItem value="3-months">{t("settings.preferences.durations.threeMonths")}</SelectItem>
                      <SelectItem value="6-months">{t("settings.preferences.durations.sixMonths")}</SelectItem>
                      <SelectItem value="1-year">{t("settings.preferences.durations.oneYear")}</SelectItem>
                      <SelectItem value="custom">{t("settings.preferences.durations.custom")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("settings.preferences.durationDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={preferencesForm.control}
              name="aiBreakdownDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.preferences.aiBreakdownDetail")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-ai-detail">
                        <SelectValue placeholder="Select detail level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">{t("settings.preferences.aiLevels.basic")}</SelectItem>
                      <SelectItem value="detailed">{t("settings.preferences.aiLevels.detailed")}</SelectItem>
                      <SelectItem value="granular">{t("settings.preferences.aiLevels.granular")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("settings.preferences.aiDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={settingsMutation.isPending}
              data-testid="button-save-preferences"
            >
              <Save className="h-4 w-4 mr-2" />
              {settingsMutation.isPending ? t("settings.profile.saving") : t("settings.preferences.savePreferences")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
