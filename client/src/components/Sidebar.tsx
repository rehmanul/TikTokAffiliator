import { Home, Settings, History, UserPlus, Filter, BarChart3, Users } from 'lucide-react';
import { useLocation } from 'wouter';

const Sidebar = () => {
  const [location] = useLocation();

  return (
    <div className="bg-white w-64 flex-shrink-0 hidden md:block shadow-lg">
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <div className="flex items-center space-x-2">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-secondary"
            fill="currentColor"
          >
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
          <span className="font-bold text-lg text-tiktok-black">TikTok Bot Affiliator</span>
        </div>
      </div>
      
      <nav className="mt-4">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Main
        </div>
        <a 
          href="/" 
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            location === '/' 
              ? 'text-tiktok-teal bg-tiktok-gray' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Home className="w-5 h-5 mr-3" />
          Dashboard
        </a>
        <a 
          href="/settings" 
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            location === '/settings' 
              ? 'text-tiktok-teal bg-tiktok-gray' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </a>
        <a 
          href="/history" 
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            location === '/history' 
              ? 'text-tiktok-teal bg-tiktok-gray' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <History className="w-5 h-5 mr-3" />
          History
        </a>
        
        <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Automation
        </div>
        <a 
          href="/invite" 
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            location === '/invite' 
              ? 'text-tiktok-teal bg-tiktok-gray' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <UserPlus className="w-5 h-5 mr-3" />
          Invite Creators
        </a>
        <a 
          href="/filters" 
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            location === '/filters' 
              ? 'text-tiktok-teal bg-tiktok-gray' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5 mr-3" />
          Filter Settings
        </a>
        <a 
          href="/analytics" 
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            location === '/analytics' 
              ? 'text-tiktok-teal bg-tiktok-gray' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Analytics
        </a>
      </nav>
      
      <div className="absolute bottom-0 w-64 border-t p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">User Account</p>
            <p className="text-xs font-medium text-gray-500">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
