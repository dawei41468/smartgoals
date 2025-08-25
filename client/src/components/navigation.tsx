import { useState } from "react";
import { Bell, Target, Settings, User, LogOut, Home, FolderOpen, TrendingUp, BarChart3, Globe, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { languages } from "@/lib/i18n";

export default function Navigation() {
  const [location] = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location === path;
  
  const getNavLinkClasses = (path: string) => {
    const baseClasses = "px-1 pb-4 text-sm font-medium";
    
    if (isActive(path)) {
      return `${baseClasses} text-primary border-b-2 border-primary`;
    }
    
    return `${baseClasses} text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white`;
  };

  const getBottomNavClasses = (path: string) => {
    if (isActive(path)) {
      return "flex flex-col items-center justify-center py-2 text-primary";
    }
    
    return "flex flex-col items-center justify-center py-2 text-gray-500 dark:text-gray-400";
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Target className="text-secondary text-xl sm:text-2xl mr-2 sm:mr-3" />
              <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">SMART Goals</span>
            </div>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <Link href="/" className={getNavLinkClasses("/")} data-testid="nav-dashboard">
                {t('nav.dashboard')}
              </Link>
              <Link href="/my-goals" className={getNavLinkClasses("/my-goals")} data-testid="nav-goals">
                {t('nav.myGoals')}
              </Link>
              <Link href="/progress" className={getNavLinkClasses("/progress")} data-testid="nav-progress">
                {t('nav.progress')}
              </Link>
              <Link href="/analytics" className={getNavLinkClasses("/analytics")} data-testid="nav-analytics">
                {t('nav.analytics')}
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={toggleTheme}
              className="hidden sm:block text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" 
              data-testid="button-theme-toggle"
              title={theme === 'light' ? t('nav.switchToDark') : t('nav.switchToLight')}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button className="hidden sm:block text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors" data-testid="avatar-user">
                  <span className="text-white text-sm font-medium">
                    {user ? (user.firstName?.[0] || '') + (user.lastName?.[0] || '') : 'U'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger data-testid="menu-language">
                    <Globe className="mr-2 h-4 w-4" />
                    <span>{t('nav.language')}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
                        data-testid={`language-${lang.code}`}
                      >
                        <span className="mr-2">{language === lang.code ? '✓' : ' '}</span>
                        {lang.nativeName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem 
                  onClick={toggleTheme}
                  className="cursor-pointer" 
                  data-testid="menu-theme"
                >
                  {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  <span>{theme === 'light' ? t('nav.switchToDark') : t('nav.switchToLight')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer" data-testid="menu-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('nav.settings')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="cursor-pointer" 
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-4">
          <Link href="/" className={getBottomNavClasses("/")} data-testid="nav-mobile-dashboard">
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>
          <Link href="/my-goals" className={getBottomNavClasses("/my-goals")} data-testid="nav-mobile-goals">
            <FolderOpen className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('nav.myGoals')}</span>
          </Link>
          <Link href="/progress" className={getBottomNavClasses("/progress")} data-testid="nav-mobile-progress">
            <TrendingUp className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('nav.progress')}</span>
          </Link>
          <Link href="/analytics" className={getBottomNavClasses("/analytics")} data-testid="nav-mobile-analytics">
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('nav.analytics')}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
