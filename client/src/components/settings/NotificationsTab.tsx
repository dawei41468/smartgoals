import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { UpdateUserSettings, UserSettings } from "@/lib/schema";
import { enablePush, disablePush } from "@/lib/push";

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  goalReminders: z.boolean(),
});

type NotificationsFormData = z.infer<typeof notificationsSchema>;

export default function NotificationsTab() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Fetch user settings data only when authenticated
  const { data: userSettings } = useQuery({
    queryKey: ["/api/user/settings"],
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const notificationsForm = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      goalReminders: true,
    },
  });

  // Update form values when settings data loads
  React.useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      const us = userSettings as Partial<UserSettings>;
      notificationsForm.reset({
        emailNotifications: us.emailNotifications ?? true,
        pushNotifications: us.pushNotifications ?? false,
        weeklyDigest: us.weeklyDigest ?? true,
        goalReminders: us.goalReminders ?? true,
      });
    }
  }, [userSettings, notificationsForm]);

  // Settings update mutation
  const settingsMutation = useMutation({
    mutationFn: (data: UpdateUserSettings) => 
      apiRequest("PATCH", "/api/user/settings", data),
    onSuccess: async (_res, variables) => {
      // Apply push subscription changes based on the submitted value
      try {
        if (typeof variables?.pushNotifications === 'boolean') {
          if (variables.pushNotifications) {
            const ok = await enablePush();
            if (!ok) {
              toast({ title: "Push Setup", description: "Unable to enable push notifications on this device.", variant: "destructive" });
            }
          } else {
            await disablePush();
          }
        }
      } catch (_) {
        // ignore subscription errors; user settings already saved
      }

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

  const onNotificationsSubmit = async (data: NotificationsFormData) => {
    settingsMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.notifications.title")}</CardTitle>
        <CardDescription>
          {t("settings.notifications.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...notificationsForm}>
          <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={notificationsForm.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("settings.notifications.emailNotifications")}</FormLabel>
                      <FormDescription>
                        {t("settings.notifications.emailDescription")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-email-notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notificationsForm.control}
                name="pushNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("settings.notifications.pushNotifications")}</FormLabel>
                      <FormDescription>
                        {t("settings.notifications.pushDescription")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-push-notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notificationsForm.control}
                name="weeklyDigest"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("settings.notifications.weeklyDigest")}</FormLabel>
                      <FormDescription>
                        {t("settings.notifications.weeklyDescription")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-weekly-digest"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notificationsForm.control}
                name="goalReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("settings.notifications.goalReminders")}</FormLabel>
                      <FormDescription>
                        {t("settings.notifications.remindersDescription")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-goal-reminders"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" data-testid="button-save-notifications">
              <Save className="h-4 w-4 mr-2" />
              {t("settings.notifications.saveNotifications")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
