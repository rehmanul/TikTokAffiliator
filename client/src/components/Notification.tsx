import { useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react';
import { NotificationType } from '../lib/types';
import { Button } from './ui/button';

interface NotificationProps {
  visible: boolean;
  title: string;
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const Notification = ({ visible, title, message, type, onClose }: NotificationProps) => {
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);
  
  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          borderColor: 'border-tiktok-teal',
          iconColor: 'text-tiktok-teal',
          icon: <CheckCircle className="h-5 w-5" />,
        };
      case 'error':
        return {
          borderColor: 'border-error',
          iconColor: 'text-error',
          icon: <XCircle className="h-5 w-5" />,
        };
      case 'warning':
        return {
          borderColor: 'border-warning',
          iconColor: 'text-warning',
          icon: <AlertCircle className="h-5 w-5" />,
        };
      case 'info':
      default:
        return {
          borderColor: 'border-info',
          iconColor: 'text-info',
          icon: <Info className="h-5 w-5" />,
        };
    }
  };
  
  const { borderColor, iconColor, icon } = getNotificationStyles();
  
  return (
    <div 
      className={`fixed top-4 right-4 max-w-xs bg-white rounded-lg shadow-lg border-l-4 ${borderColor} z-50 transform transition-transform duration-300 ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className={iconColor}>{icon}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex text-gray-400 hover:text-gray-500 h-5 w-5"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
