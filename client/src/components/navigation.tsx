import { useState } from "react";
import { Bell, Target, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Target className="text-purple-600 text-xl sm:text-2xl mr-2 sm:mr-3" style={{background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}} />
              <span className="text-lg sm:text-xl font-bold text-gray-900">SMART Goals</span>
            </div>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <a href="#" className="text-primary border-b-2 border-primary px-1 pb-4 text-sm font-medium" data-testid="nav-dashboard">
                Dashboard
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium" data-testid="nav-goals">
                My Goals
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium" data-testid="nav-progress">
                Progress
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium" data-testid="nav-analytics">
                Analytics
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="hidden sm:block text-gray-400 hover:text-gray-500" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center" data-testid="avatar-user">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
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
              <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="nav-mobile-goals">
                My Goals
              </a>
              <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="nav-mobile-progress">
                Progress
              </a>
              <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="nav-mobile-analytics">
                Analytics
              </a>
              <div className="border-t border-gray-200 pt-2">
                <button className="flex items-center w-full px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm font-medium" data-testid="button-mobile-notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
