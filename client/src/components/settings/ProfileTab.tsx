import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UpdateUserProfile } from "@/lib/schema";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileTab() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();

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

  return (
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
  );
}
