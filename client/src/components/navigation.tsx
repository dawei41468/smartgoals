import { useState } from "react";
import { Bell, Target, Menu, X, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Target className="text-secondary text-xl sm:text-2xl mr-2 sm:mr-3" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">SMART Goals</span>
            </div>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <a href="#" className="text-primary border-b-2 border-primary px-1 pb-4 text-sm font-medium" data-testid="nav-dashboard">
                Dashboard
              </a>
              <Link href="/my-goals" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium" data-testid="nav-goals">
                My Goals
              </Link>
              <Link href="/progress" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium" data-testid="nav-progress">
                Progress
              </Link>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium" data-testid="nav-analytics">
                Analytics
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="hidden sm:block text-gray-400 hover:text-gray-500" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors" data-testid="avatar-user">
                  <span className="text-white text-sm font-medium">JD</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">john.doe@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer" data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer" data-testid="menu-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 text-primary bg-primary/5 border-l-4 border-primary text-sm font-medium" data-testid="nav-mobile-dashboard">
                Dashboard
              </a>
              <Link href="/my-goals" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="nav-mobile-goals">
                My Goals
              </Link>
              <Link href="/progress" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="nav-mobile-progress">
                Progress
              </Link>
              <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="nav-mobile-analytics">
                Analytics
              </a>
              <div className="border-t border-gray-200 pt-2">
                <button className="flex items-center w-full px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="button-mobile-notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </button>
                <Link href="/settings" className="flex items-center w-full px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="nav-mobile-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
