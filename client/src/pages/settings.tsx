import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, User, Bell, Palette, Shield, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserSettings, UpdateUserProfile, UpdateUserSettings } from "@/lib/schema";
import { enablePush, disablePush } from "@/lib/push";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  goalReminders: z.boolean(),
  defaultGoalDuration: z.string(),
  aiBreakdownDetail: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Fetch user profile data only when authenticated
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    staleTime: 5 * 60 * 1000,
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Fetch user settings data only when authenticated
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/user/settings"],
    staleTime: 5 * 60 * 1000,
    enabled: !!user, // Only fetch when user is authenticated
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: user?.bio || "",
    },
  });

  // Update form values when user data is available
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        bio: user.bio || "",
      });
    }
  }, [user, profileForm]);

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      goalReminders: true,
      defaultGoalDuration: "3-months",
      aiBreakdownDetail: "detailed",
    },
  });

  // Update form values when settings data loads
  React.useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      const us = userSettings as Partial<UserSettings>;
      preferencesForm.reset({
        emailNotifications: us.emailNotifications ?? true,
        pushNotifications: us.pushNotifications ?? false,
        weeklyDigest: us.weeklyDigest ?? true,
        goalReminders: us.goalReminders ?? true,
        defaultGoalDuration: us.defaultGoalDuration || "3-months",
        aiBreakdownDetail: us.aiBreakdownDetail || "detailed",
      });
    }
  }, [userSettings, preferencesForm]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (data: UpdateUserProfile) => 
      apiRequest("PATCH", "/api/user/profile", data),
    onSuccess: async (response) => {
      // Get the updated user data from the response
      const result = await response.json();
      
      // Update the auth context with new user data
      if (result && typeof result === 'object') {
        updateUser(result);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: t("settings.messages.profileUpdated"),
        description: t("settings.messages.profileSuccess"),
      });
    },
    onError: async (error: any) => {
      let errorMessage = "Failed to update profile information.";
      if (error?.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Fall back to default message
        }
      }
      
      toast({
        title: t("settings.messages.updateFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    profileMutation.mutate(data);
  };

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

  const onPreferencesSubmit = async (data: PreferencesFormData) => {
    settingsMutation.mutate(data);
  };

  const handleLogout = () => {
    toast({
      title: t("settings.messages.loggedOut"),
      description: t("settings.messages.logoutSuccess"),
    });
  };

  const tabs = [
    { id: "profile", label: t("settings.tabs.profile"), icon: User },
    { id: "notifications", label: t("settings.tabs.notifications"), icon: Bell },
    { id: "preferences", label: t("settings.tabs.preferences"), icon: Palette },
    { id: "security", label: t("settings.tabs.security"), icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("settings.backToDashboard")}
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t("settings.title")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t("settings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? "bg-primary text-white"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        data-testid={`tab-${tab.id}`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.profile.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.profile.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("settings.profile.firstName")}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("settings.profile.lastName")}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("settings.profile.email")}</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("settings.profile.bio")}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={4}
                                placeholder={t("settings.profile.bioPlaceholder")}
                                data-testid="input-bio"
                              />
                            </FormControl>
                            <FormDescription>
                              {t("settings.profile.bioDescription")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={profileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {profileMutation.isPending ? t("settings.profile.saving") : t("settings.profile.saveProfile")}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.notifications.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.notifications.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={preferencesForm.control}
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
                          control={preferencesForm.control}
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
                          control={preferencesForm.control}
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
                          control={preferencesForm.control}
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
            )}

            {activeTab === "preferences" && (
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
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.security.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.security.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium mb-2">{t("settings.security.changePassword")}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t("settings.security.passwordDescription")}
                      </p>
                      <Button variant="outline" data-testid="button-change-password">
                        {t("settings.security.changePassword")}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium mb-2">{t("settings.security.twoFactor")}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t("settings.security.twoFactorDescription")}
                      </p>
                      <Button variant="outline" data-testid="button-setup-2fa">
                        {t("settings.security.setup2FA")}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium mb-2">{t("settings.security.exportData")}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t("settings.security.exportDescription")}
                      </p>
                      <Button variant="outline" data-testid="button-export-data">
                        {t("settings.security.exportMyData")}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-lg border border-red-200 p-4">
                      <h3 className="text-lg font-medium text-red-900 mb-2">{t("settings.security.dangerZone")}</h3>
                      <p className="text-sm text-red-700 mb-4">
                        {t("settings.security.deleteDescription")}
                      </p>
                      <Button variant="destructive" data-testid="button-delete-account">
                        {t("settings.security.deleteAccount")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto logout-button"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("settings.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}