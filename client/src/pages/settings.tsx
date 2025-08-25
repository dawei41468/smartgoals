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
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType, UserSettings, UpdateUserProfile, UpdateUserSettings } from "@shared/schema";

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
  theme: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();

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
      theme: "light",
    },
  });

  // Update form values when settings data loads
  React.useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      preferencesForm.reset({
        emailNotifications: userSettings.emailNotifications ?? true,
        pushNotifications: userSettings.pushNotifications ?? false,
        weeklyDigest: userSettings.weeklyDigest ?? true,
        goalReminders: userSettings.goalReminders ?? true,
        defaultGoalDuration: userSettings.defaultGoalDuration || "3-months",
        aiBreakdownDetail: userSettings.aiBreakdownDetail || "detailed",
        theme: userSettings.theme || "light",
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
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
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
        title: "Update Failed",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const onPreferencesSubmit = (data: PreferencesFormData) => {
    settingsMutation.mutate(data);
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
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
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
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
                              <FormLabel>First Name</FormLabel>
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
                              <FormLabel>Last Name</FormLabel>
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
                            <FormLabel>Email Address</FormLabel>
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
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={4}
                                placeholder="Tell us a bit about yourself and your goals..."
                                data-testid="input-bio"
                              />
                            </FormControl>
                            <FormDescription>
                              Optional: Share a brief description about yourself
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
                        {profileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about your goals and progress
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
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive email updates about your goals and tasks
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
                                <FormLabel className="text-base">Push Notifications</FormLabel>
                                <FormDescription>
                                  Receive push notifications on your devices
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
                                <FormLabel className="text-base">Weekly Progress Digest</FormLabel>
                                <FormDescription>
                                  Get a weekly summary of your goal progress
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
                                <FormLabel className="text-base">Goal Reminders</FormLabel>
                                <FormDescription>
                                  Daily reminders about your active goals and tasks
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
                        Save Notification Preferences
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Preferences</CardTitle>
                  <CardDescription>
                    Customize your goal-setting experience and AI assistance
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
                            <FormLabel>Default Goal Duration</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-goal-duration">
                                  <SelectValue placeholder="Select default duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-month">1 Month</SelectItem>
                                <SelectItem value="3-months">3 Months</SelectItem>
                                <SelectItem value="6-months">6 Months</SelectItem>
                                <SelectItem value="1-year">1 Year</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Default timeframe for new goals
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
                            <FormLabel>AI Breakdown Detail Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-ai-detail">
                                  <SelectValue placeholder="Select detail level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic - High-level milestones</SelectItem>
                                <SelectItem value="detailed">Detailed - Comprehensive breakdown</SelectItem>
                                <SelectItem value="granular">Granular - Daily task specifics</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How detailed should AI goal breakdowns be
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={preferencesForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-theme">
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose your preferred color theme
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
                        {settingsMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security & Account</CardTitle>
                  <CardDescription>
                    Manage your account security and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium mb-2">Change Password</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Update your password to keep your account secure
                      </p>
                      <Button variant="outline" data-testid="button-change-password">
                        Change Password
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline" data-testid="button-setup-2fa">
                        Setup 2FA
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium mb-2">Export Data</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Download a copy of your goals and progress data
                      </p>
                      <Button variant="outline" data-testid="button-export-data">
                        Export My Data
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="rounded-lg border border-red-200 p-4">
                      <h3 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
                      <p className="text-sm text-red-700 mb-4">
                        Permanently delete your account and all associated data
                      </p>
                      <Button variant="destructive" data-testid="button-delete-account">
                        Delete Account
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
            className="w-full sm:w-auto"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}