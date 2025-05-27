import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatusCards from "../components/StatusCards";
import ConfigSection from "../components/ConfigSection";
import ActivityLogs from "../components/ActivityLogs";
import VerificationModal from "../components/VerificationModal";
import BotConsole from "../components/BotConsole";
import Notification from "../components/Notification";
import AIContentGenerator from "../components/AIContentGenerator";
import { getBotStatus, getActivityLogs, getBotConfig, startBot, stopBot } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { BotStatus, BotConfig, ActivityLog, NotificationType } from "../lib/types";

interface NotificationState {
  visible: boolean;
  title: string;
  message: string;
  type: NotificationType;
  onClose: () => void;  // Made this required
}

const Dashboard = () => {
  const closeNotification = () => setNotification(prev => ({ ...prev, visible: false }));
  
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    title: "",
    message: "",
    type: "success",
    onClose: closeNotification  // Always provide the close function
  });
  
  // Fetch bot status
  const { 
    data: botStatus,
    isLoading: isLoadingStatus
  } = useQuery({
    queryKey: ["/api/status"],
    queryFn: getBotStatus,
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  // Fetch bot config
  const {
    data: botConfig,
    isLoading: isLoadingConfig
  } = useQuery({
    queryKey: ["/api/config"],
    queryFn: getBotConfig
  });
  
  // Fetch activity logs
  const { 
    data: activityLogs = [],
    isLoading: isLoadingLogs
  } = useQuery({
    queryKey: ["/api/logs"],
    queryFn: () => getActivityLogs(1, 10),
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  // Start bot mutation
  const startBotMutation = useMutation({
    mutationFn: startBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      showNotification("Bot Started", "The bot has been started successfully.", "success");
    },
    onError: (err: Error) => {
      showNotification("Bot Start Failed", `Error: ${err.message}`, "error");
    }
  });
  
  // Stop bot mutation
  const stopBotMutation = useMutation({
    mutationFn: stopBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      showNotification("Bot Stopped", "The bot has been stopped successfully.", "success");
    },
    onError: (err: Error) => {
      showNotification("Bot Stop Failed", `Error: ${err.message}`, "error");
    }
  });
  
  // Detect when verification might be needed
  useEffect(() => {
    if (activityLogs?.length > 0) {
      const recentLogs = activityLogs.slice(0, 5);
      
      // Check for verification messages
      const needsVerification = recentLogs.some(log => 
        (log.type === 'Verification' && log.status === 'Pending') ||
        (log.message.toLowerCase().includes('verification') && 
         log.message.toLowerCase().includes('required'))
      );
      
      if (needsVerification && !isVerificationModalOpen) {
        setIsVerificationModalOpen(true);
      }
    }
  }, [activityLogs, isVerificationModalOpen]);
  
  // Show notification
  const showNotification = (title: string, message: string, type: NotificationType = "success") => {
    setNotification({
      visible: true,
      title,
      message,
      type,
      onClose: closeNotification
    });
    
    // Auto-hide after 5 seconds
    setTimeout(closeNotification, 5000);
  };
  
  // Toggle bot status
  const toggleBotStatus = () => {
    if (botStatus?.status === "running") {
      stopBotMutation.mutate();
    } else {
      startBotMutation.mutate();
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {/* Status Cards */}
          <StatusCards 
            botStatus={botStatus} 
            botConfig={botConfig}
            isLoading={isLoadingStatus || isLoadingConfig}
            onToggleBotStatus={toggleBotStatus}
            isMutating={startBotMutation.isLoading || stopBotMutation.isLoading}
          />
          
          {/* Config Section */}
          <ConfigSection 
            botConfig={botConfig} 
            isLoading={isLoadingConfig}
            onConfigSaved={() => {
              showNotification(
                "Configuration Saved", 
                "Your bot configuration has been updated successfully."
              );
            }}
            onTestLogin={() => setIsVerificationModalOpen(true)}
          />
          
          {/* AI Content Generator */}
          <AIContentGenerator 
            onContentGenerated={(content) => {
              showNotification(
                "Message Generated", 
                "AI-generated message is ready to use with your invitations.",
                "success"
              );
              // Here we could store the generated content in state or pass it to another component
              console.log("Generated content:", content);
            }}
          />
          
          {/* Activity Logs */}
          <ActivityLogs 
            logs={activityLogs} 
            isLoading={isLoadingLogs}
            onLogCleared={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
              showNotification(
                "Logs Cleared", 
                "Activity logs have been cleared successfully."
              );
            }}
          />
        </main>
      </div>
      
      {/* Verification Modal */}
      <VerificationModal 
        isOpen={isVerificationModalOpen} 
        onClose={() => setIsVerificationModalOpen(false)} 
        onSubmit={() => {
          setIsVerificationModalOpen(false);
          showNotification(
            "Verification Successful", 
            "Your verification has been completed successfully."
          );
        }}
      />
      
      {/* Bot Console */}
      <BotConsole 
        isOpen={isConsoleOpen} 
        onToggle={() => setIsConsoleOpen(!isConsoleOpen)}
        logs={activityLogs.filter(log => log.type === "System")}
      />
      
      {/* Notification */}
      <Notification 
        visible={notification.visible}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={notification.onClose}
      />
    </div>
  );
};

export default Dashboard;
