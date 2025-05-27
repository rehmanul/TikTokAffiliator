import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent,
  Button,
  Skeleton
} from './ui';
import { 
  Filter,
  Download,
  Trash2
} from 'lucide-react';
import { ActivityLog } from '../lib/types';
import { clearActivityLogs } from '../lib/api';
import { queryClient } from '../lib/queryClient';

interface ActivityLogsProps {
  logs: ActivityLog[];
  isLoading: boolean;
  onLogCleared: () => void;
}

const ActivityLogs = ({ logs, isLoading, onLogCleared }: ActivityLogsProps) => {
  const [activeFilter, setActiveFilter] = useState<ActivityLog['type'] | 'All'>('All');
  
  const clearLogsMutation = useMutation({
    mutationFn: clearActivityLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      onLogCleared();
    }
  });
  
  const getStatusClassName = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTypeClassName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'login':
        return 'bg-tiktok-teal/10 text-tiktok-teal';
      case 'filter':
        return 'bg-blue-100 text-blue-800';
      case 'invite':
        return 'bg-indigo-100 text-indigo-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'verification':
        return 'bg-amber-100 text-amber-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'navigation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const filteredLogs = activeFilter === 'All' 
    ? logs 
    : logs.filter(log => log.type === activeFilter);
  
  const logTypeCounts = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<ActivityLog['type'], number>);
  
  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-800">Activity Logs</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-gray-700">
            <Filter className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-gray-700">
            <Download className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-gray-700"
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isLoading}>
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`rounded-full text-xs font-medium ${
              activeFilter === 'All' 
                ? 'bg-tiktok-teal/10 border-tiktok-teal/30 text-tiktok-teal' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
            onClick={() => setActiveFilter('All')}
          >
            All
          </Button>
          
          {Object.keys(logTypeCounts).map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className={`rounded-full text-xs font-medium ${
                activeFilter === type 
                  ? 'bg-tiktok-teal/10 border-tiktok-teal/30 text-tiktok-teal' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
              onClick={() => setActiveFilter(type as ActivityLog['type'])}
            >
              {type} <span className="ml-1 text-xs">{logTypeCounts[type as ActivityLog['type']]}</span>
            </Button>
          ))}
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeClassName(log.type)}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClassName(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLogs.length}</span> of <span className="font-medium">{logs.length}</span> results
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              disabled
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              disabled
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityLogs;
