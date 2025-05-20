import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Input,
  Label,
  Alert,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Mail, MessageSquare, CheckCircle } from 'lucide-react';

// Enum for authentication states
enum AuthState {
  IDLE,
  LOADING,
  ERROR,
  READY_FOR_CODE,
  COMPLETE
}

// For verification code entry
const VerificationCodeInput = ({ 
  value, 
  onChange, 
  isSubmitting = false,
  onSubmit
}: { 
  value: string; 
  onChange: (value: string) => void;
  isSubmitting?: boolean;
  onSubmit: () => void;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.length >= 4) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verification-code">Verification Code</Label>
        <Input
          id="verification-code"
          type="text"
          placeholder="Enter verification code"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-center text-lg tracking-widest"
          maxLength={6}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Check your email for a verification code sent by TikTok
        </p>
      </div>
      
      <Button 
        type="button" 
        className="w-full bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
        disabled={!value.trim() || isSubmitting || value.length < 4}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Submit Code'
        )}
      </Button>
    </div>
  );
};

// Real login functions - will connect to the TikTok API via our server
const startTikTokBot = async () => {
  try {
    const response = await fetch('/api/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start TikTok bot');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

const submitVerificationCode = async (code: string) => {
  try {
    const response = await fetch('/api/verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid verification code');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

const getBotStatus = async () => {
  try {
    const response = await fetch('/api/status');
    
    if (!response.ok) {
      throw new Error('Failed to get bot status');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

const Login = () => {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthState>(AuthState.IDLE);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('credentials');
  
  // Check if we already have verification codes from TikTok
  const [recentVerificationCodes, setRecentVerificationCodes] = useState<string[]>([]);
  
  // Check if there are verification codes in the email
  useEffect(() => {
    // This would be replaced with actual email checking in a production app
    // For this demo, we'll simulate finding verification codes
    const codes = ['639678', '477359', '353557'];
    setRecentVerificationCodes(codes);
  }, []);
  
  // Start bot mutation - will open a headless browser on the server
  const startBotMutation = useMutation({
    mutationFn: startTikTokBot,
    onSuccess: () => {
      setAuthState(AuthState.LOADING);
      
      // Poll for bot status to see if verification is needed
      const checkBotStatus = async () => {
        try {
          const status = await getBotStatus();
          
          if (status.status === 'running') {
            // Bot is running, move to dashboard
            setAuthState(AuthState.COMPLETE);
            localStorage.setItem('isLoggedIn', 'true');
            setLocation('/');
          } else if (status.status === 'error') {
            setError('Bot encountered an error. Please try again.');
            setAuthState(AuthState.ERROR);
          } else if (status.status === 'verification_required') {
            // Bot needs verification code
            setAuthState(AuthState.READY_FOR_CODE);
            setActiveTab('verification');
          } else {
            // Still initializing or processing, check again
            setTimeout(checkBotStatus, 2000);
          }
        } catch (error) {
          setError('Failed to check bot status. Please try again.');
          setAuthState(AuthState.ERROR);
        }
      };
      
      checkBotStatus();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to start TikTok bot. Please try again.');
      setAuthState(AuthState.ERROR);
    }
  });
  
  // Verification code submission
  const verificationMutation = useMutation({
    mutationFn: (code: string) => submitVerificationCode(code),
    onSuccess: () => {
      // After verification, wait for bot to process
      setAuthState(AuthState.LOADING);
      
      // Poll for status again
      const checkPostVerificationStatus = async () => {
        try {
          const status = await getBotStatus();
          
          if (status.status === 'running') {
            // Bot is running, move to dashboard
            setAuthState(AuthState.COMPLETE);
            localStorage.setItem('isLoggedIn', 'true');
            setLocation('/');
          } else if (status.status === 'error') {
            setError('Bot encountered an error after verification. Please try again.');
            setAuthState(AuthState.ERROR);
          } else {
            // Still processing, check again
            setTimeout(checkPostVerificationStatus, 2000);
          }
        } catch (error) {
          setError('Failed to check bot status. Please try again.');
          setAuthState(AuthState.ERROR);
        }
      };
      
      checkPostVerificationStatus();
    },
    onError: (error: any) => {
      setError(error.message || 'Invalid verification code. Please try again.');
      // Stay on verification page
      setAuthState(AuthState.READY_FOR_CODE);
    }
  });
  
  // Handle login start - will connect to actual TikTok site via our bot
  const handleStartLogin = () => {
    setError(null);
    setAuthState(AuthState.LOADING);
    startBotMutation.mutate();
  };
  
  // Handle verification code submission
  const handleVerificationSubmit = () => {
    if (!verificationCode.trim() || verificationCode.length < 4) {
      setError('Please enter a valid verification code.');
      return;
    }
    
    verificationMutation.mutate(verificationCode);
  };
  
  // Use a verification code from the list
  const useVerificationCode = (code: string) => {
    setVerificationCode(code);
    // Automatically submit after selecting a code
    setTimeout(() => {
      verificationMutation.mutate(code);
    }, 500);
  };
  
  const isLoading = authState === AuthState.LOADING || 
                   startBotMutation.isPending || 
                   verificationMutation.isPending;
                   
  const renderContent = () => {
    switch (authState) {
      case AuthState.READY_FOR_CODE:
        return (
          <CardContent className="space-y-4 pt-3">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="text-center mb-4">
              <CheckCircle className="h-12 w-12 text-tiktok-teal mx-auto mb-2" />
              <h3 className="text-lg font-medium">Verification Required</h3>
              <p className="text-sm text-gray-500 mt-1">
                TikTok has sent a verification code to your email address.
              </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="verification">Enter Code</TabsTrigger>
                <TabsTrigger value="recent">Recent Codes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="verification" className="pt-4">
                <VerificationCodeInput 
                  value={verificationCode} 
                  onChange={setVerificationCode}
                  isSubmitting={verificationMutation.isPending}
                  onSubmit={handleVerificationSubmit}
                />
              </TabsContent>
              
              <TabsContent value="recent" className="pt-4">
                {recentVerificationCodes.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Select one of your recent verification codes:</p>
                    {recentVerificationCodes.map((code, index) => (
                      <div 
                        key={index}
                        className="p-3 border border-gray-200 rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-50"
                        onClick={() => useVerificationCode(code)}
                      >
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-mono">{code}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            useVerificationCode(code);
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No recent codes found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        );
        
      case AuthState.LOADING:
        return (
          <CardContent className="space-y-4 text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-tiktok-teal mx-auto" />
            <p className="text-gray-600">Connecting to TikTok...</p>
            <p className="text-sm text-gray-500">
              We're opening a secure connection to TikTok. This may take a moment.
            </p>
          </CardContent>
        );
        
      case AuthState.ERROR:
        return (
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="button" 
              className="w-full bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
              onClick={handleStartLogin}
              disabled={isLoading}
            >
              Try Again
            </Button>
          </CardContent>
        );
        
      case AuthState.IDLE:
      default:
        return (
          <>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <MessageSquare className="h-10 w-10 text-tiktok-teal mb-2" />
                <h3 className="text-lg font-medium">TikTok Login</h3>
                <p className="text-sm text-gray-500 text-center mt-1 mb-4">
                  The bot will open a secure connection to TikTok and handle authentication automatically.
                </p>
                <p className="text-sm text-gray-700 font-medium mb-1">Default Credentials:</p>
                <p className="text-xs text-gray-500 mb-4">rehman.shoj2@gmail.com / Rehm@n998088</p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="button" 
                className="w-full bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
                onClick={handleStartLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect to TikTok'
                )}
              </Button>
            </CardFooter>
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tiktok-gray">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-tiktok-teal" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">TikTok Bot Affiliator</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to access your affiliate automation dashboard
          </p>
        </CardHeader>
        
        {renderContent()}
      </Card>
    </div>
  );
};

export default Login;