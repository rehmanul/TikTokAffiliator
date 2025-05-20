import { Bot, Send, TrendingUp } from 'lucide-react';
import { BotStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusCardsProps {
  botStatus?: BotStatus;
  isLoading: boolean;
  onToggleBotStatus: () => void;
  isMutating: boolean;
}

const StatusCards = ({ botStatus, isLoading, onToggleBotStatus, isMutating }: StatusCardsProps) => {
  const isRunning = botStatus?.status === 'running';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Bot Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Bot Status</p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className={`mt-1 text-xl font-semibold ${isRunning ? 'text-success' : 'text-error'}`}>
                {isRunning ? 'Running' : 'Stopped'}
              </p>
            )}
          </div>
          <div className={`${isRunning ? 'bg-success' : 'bg-error'} bg-opacity-10 rounded-full p-3`}>
            <Bot className={`${isRunning ? 'text-success' : 'text-error'}`} />
          </div>
        </div>
        <div className="mt-4">
          <Button 
            variant="destructive" 
            className={isRunning ? 'bg-error hover:bg-red-600' : 'bg-success hover:bg-green-600'}
            onClick={onToggleBotStatus}
            disabled={isMutating || isLoading}
          >
            {isRunning ? 'Stop Bot' : 'Start Bot'}
          </Button>
        </div>
      </div>
      
      {/* Invitations Sent Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Invitations Sent Today</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="mt-1 text-xl font-semibold text-gray-800">
                {botStatus?.invitationsSent || 0}
              </p>
            )}
          </div>
          <div className="bg-info bg-opacity-10 rounded-full p-3">
            <Send className="text-info" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center">
            <div className="h-2 rounded-full bg-gray-200 w-full">
              {isLoading ? (
                <Skeleton className="h-2 w-2/5 rounded-full" />
              ) : (
                <div 
                  className="h-2 rounded-full bg-info" 
                  style={{ 
                    width: `${Math.min(100, (botStatus?.invitationsSent || 0) / (botStatus?.invitationsTarget || 60) * 100)}%` 
                  }}
                ></div>
              )}
            </div>
            <span className="ml-2 text-xs font-medium text-gray-500">
              {isLoading ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                `${Math.min(100, Math.round((botStatus?.invitationsSent || 0) / (botStatus?.invitationsTarget || 60) * 100))}%`
              )}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Daily target: {botStatus?.invitationsTarget || 60} invitations
          </p>
        </div>
      </div>
      
      {/* Success Rate Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Success Rate</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="mt-1 text-xl font-semibold text-gray-800">
                {botStatus?.successRate || 95}%
              </p>
            )}
          </div>
          <div className="bg-success bg-opacity-10 rounded-full p-3">
            <TrendingUp className="text-success" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Success</span>
            {isLoading ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <span className="font-medium text-gray-800">{botStatus?.successRate || 95}%</span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 w-full">
            {isLoading ? (
              <Skeleton className="h-1.5 w-11/12 rounded-full" />
            ) : (
              <div 
                className="h-1.5 rounded-full bg-success" 
                style={{ width: `${botStatus?.successRate || 95}%` }}
              ></div>
            )}
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Fails</span>
            {isLoading ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <span className="font-medium text-gray-800">{100 - (botStatus?.successRate || 95)}%</span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 w-full">
            {isLoading ? (
              <Skeleton className="h-1.5 w-1/12 rounded-full" />
            ) : (
              <div 
                className="h-1.5 rounded-full bg-error" 
                style={{ width: `${100 - (botStatus?.successRate || 95)}%` }}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCards;
