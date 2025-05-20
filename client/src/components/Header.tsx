import { Bell, HelpCircle, ChevronDown, AlignJustify } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button className="md:hidden mr-4 text-gray-500">
          <AlignJustify className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-700">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-8 border-l border-gray-200"></div>
        <div className="relative">
          <button className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <span>English</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
