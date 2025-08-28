import React, { useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import ProfileTab from "@/components/settings/ProfileTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import PreferencesTab from "@/components/settings/PreferencesTab";
import SecurityTab from "@/components/settings/SecurityTab";
import SettingsNavigation from "@/components/settings/SettingsNavigation";


export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const { t } = useLanguage();


  const handleLogout = () => {
    toast({
      title: t("settings.messages.loggedOut"),
      description: t("settings.messages.logoutSuccess"),
    });
  };


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
            <SettingsNavigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "preferences" && <PreferencesTab />}
            {activeTab === "security" && <SecurityTab />}
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