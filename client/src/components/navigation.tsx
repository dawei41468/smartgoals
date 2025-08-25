import { Bell, Target } from "lucide-react";

export default function Navigation() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Target className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-gray-900">SMART Goals</span>
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
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-500" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center" data-testid="avatar-user">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
