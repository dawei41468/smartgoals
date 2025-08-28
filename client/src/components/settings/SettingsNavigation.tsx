import React from "react";
import { User, Bell, Palette, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SettingsNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SettingsNavigation({ activeTab, onTabChange }: SettingsNavigationProps) {
  const { t } = useLanguage();

  const tabs: Tab[] = [
    { id: "profile", label: t("settings.tabs.profile"), icon: User },
    { id: "notifications", label: t("settings.tabs.notifications"), icon: Bell },
    { id: "preferences", label: t("settings.tabs.preferences"), icon: Palette },
    { id: "security", label: t("settings.tabs.security"), icon: Shield },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
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
  );
}
