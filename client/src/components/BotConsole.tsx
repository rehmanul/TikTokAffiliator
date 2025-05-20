import { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { ActivityLog } from '@/lib/types';

interface BotConsoleProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: ActivityLog[];
}

const BotConsole = ({ isOpen, onToggle, logs }: BotConsoleProps) => {
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  
  // Update console with logs
  useEffect(() => {
    if (logs && logs.length > 0) {
      const formattedLogs = logs.map(log => `> ${log.message}`);
      setConsoleMessages(formattedLogs);
      
      // Scroll to bottom when new logs come in
      if (consoleRef.current && isOpen) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }
  }, [logs, isOpen]);
  
  const clearConsole = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConsoleMessages([]);
  };
  
  return (
    <div 
      className={`fixed bottom-0 right-0 w-full md:w-1/2 z-40 bg-gray-900 text-green-500 rounded-t-lg shadow-lg transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div 
        className="px-4 py-2 bg-gray-800 rounded-t-lg flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center">
          <Terminal className="mr-2" />
          <h3 className="text-sm font-mono font-medium text-white">Bot Console</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white h-6 w-6"
            onClick={clearConsole}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white h-6 w-6"
            onClick={onToggle}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div 
        className="h-64 overflow-y-auto p-4 font-mono text-xs bg-gray-900"
        ref={consoleRef}
      >
        {consoleMessages.length === 0 ? (
          <div className="text-gray-500 italic">Console is empty. Bot operations will appear here.</div>
        ) : (
          consoleMessages.map((message, index) => (
            <div key={index} className="mb-1">{message}</div>
          ))
        )}
      </div>
    </div>
  );
};

export default BotConsole;
