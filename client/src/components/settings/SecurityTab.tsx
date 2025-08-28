import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SecurityTab() {
  const { t } = useLanguage();

  return (
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
  );
}
