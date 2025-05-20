import { useState, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import { RefreshCw, X } from 'lucide-react';

// Enum for authentication steps
enum AuthStep {
  CREDENTIALS,
  CAPTCHA,
  VERIFICATION,
  COMPLETE
}

// Mock login function - in a real app, this would connect to the TikTok API
const performLogin = async (credentials: { email: string; password: string }) => {
  // Simulating API call
  return new Promise<{ success: boolean, requiresCaptcha: boolean, message?: string }>((resolve) => {
    setTimeout(() => {
      // Check for our hardcoded credentials and simulate captcha requirement
      if (credentials.email === 'rehman.shoj2@gmail.com' && credentials.password === 'Rehm@n998088') {
        resolve({ success: true, requiresCaptcha: true });
      } else {
        resolve({ 
          success: false, 
          requiresCaptcha: false,
          message: 'Invalid credentials. Please try again.'
        });
      }
    }, 1000);
  });
};

// Mock captcha verification function
const verifyCaptcha = async (captchaToken: string) => {
  return new Promise<{ success: boolean, requiresVerification: boolean, message?: string }>((resolve) => {
    setTimeout(() => {
      // Simulate requiring verification code after captcha
      if (captchaToken) {
        resolve({ success: true, requiresVerification: true });
      } else {
        resolve({ 
          success: false, 
          requiresVerification: false,
          message: 'Captcha verification failed.'
        });
      }
    }, 1000);
  });
};

// Mock verification code validation
const submitVerificationCode = async (code: string) => {
  return new Promise<{ success: boolean, message?: string }>((resolve) => {
    setTimeout(() => {
      // Any code will work for this mock
      if (code && code.length >= 4) {
        resolve({ success: true });
      } else {
        resolve({ 
          success: false, 
          message: 'Invalid verification code. Please try again.'
        });
      }
    }, 1000);
  });
};

const Login = () => {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('rehman.shoj2@gmail.com');
  const [password, setPassword] = useState('Rehm@n998088');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AuthStep>(AuthStep.CREDENTIALS);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const captchaRef = useRef<HTMLDivElement>(null);
  
  // Simulate captcha image refreshing
  const refreshCaptcha = () => {
    // In a real app, this would request a new captcha image
    setTimeout(() => {
      setCaptchaToken('');
    }, 500);
  };
  
  // Mock captcha solving (simulate clicking on the correct shape)
  const handleCaptchaClick = () => {
    // Simulate successful captcha solution
    setCaptchaToken('captcha_token_123456');
  };

  // Handle initial login (credentials)
  const loginMutation = useMutation({
    mutationFn: performLogin,
    onSuccess: (data) => {
      if (data.success) {
        // If captcha is required, move to captcha step
        if (data.requiresCaptcha) {
          setCurrentStep(AuthStep.CAPTCHA);
        } else {
          // If no captcha, go straight to dashboard
          completeLogin();
        }
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    },
    onError: () => {
      setError('An unexpected error occurred. Please try again.');
    }
  });
  
  // Handle captcha verification
  const captchaMutation = useMutation({
    mutationFn: () => verifyCaptcha(captchaToken),
    onSuccess: (data) => {
      if (data.success) {
        // If verification code is required, move to that step
        if (data.requiresVerification) {
          setCurrentStep(AuthStep.VERIFICATION);
        } else {
          // If no verification needed, complete login
          completeLogin();
        }
      } else {
        setError(data.message || 'Captcha verification failed. Please try again.');
        setCaptchaToken('');
      }
    },
    onError: () => {
      setError('An unexpected error occurred during captcha verification.');
      setCaptchaToken('');
    }
  });
  
  // Handle verification code submission
  const verificationMutation = useMutation({
    mutationFn: (code: string) => submitVerificationCode(code),
    onSuccess: (data) => {
      if (data.success) {
        completeLogin();
      } else {
        setError(data.message || 'Verification failed. Please try again.');
        setVerificationCode('');
      }
    },
    onError: () => {
      setError('An unexpected error occurred during verification.');
      setVerificationCode('');
    }
  });
  
  // Complete login process
  const completeLogin = () => {
    setCurrentStep(AuthStep.COMPLETE);
    localStorage.setItem('isLoggedIn', 'true');
    setLocation('/');
  };

  // Initial login form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    
    loginMutation.mutate({ email, password });
  };
  
  // Handle captcha submission
  const handleCaptchaSubmit = () => {
    if (!captchaToken) {
      setError('Please solve the captcha puzzle first.');
      return;
    }
    
    captchaMutation.mutate();
  };
  
  // Handle verification code submission
  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    
    verificationMutation.mutate(verificationCode);
  };
  
  // Render different content based on current authentication step
  const renderStepContent = () => {
    switch (currentStep) {
      case AuthStep.CREDENTIALS:
        return (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-tiktok-teal hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        );
        
      case AuthStep.CAPTCHA:
        return (
          <div className="p-6">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-medium">Security Check</h3>
              <p className="text-sm text-gray-500">Please solve the captcha to continue</p>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div 
              ref={captchaRef}
              className="relative border border-gray-200 rounded-md p-4 mb-4 h-48 flex items-center justify-center bg-gray-50"
            >
              <div className="text-center">
                <p className="text-sm mb-2">Click on the matching shape to verify</p>
                <div className="flex gap-4 mt-4">
                  <div 
                    className="w-16 h-16 border border-gray-300 rounded cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                    onClick={handleCaptchaClick}
                  >
                    {captchaToken ? 
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div> :
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    }
                  </div>
                  <div 
                    className="w-16 h-16 border border-gray-300 rounded cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                  >
                    <div className="w-8 h-8 bg-gray-300"></div>
                  </div>
                  <div 
                    className="w-16 h-16 border border-gray-300 rounded cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                  >
                    <div className="w-8 h-8 bg-gray-300" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                  </div>
                </div>
              </div>
              <button 
                type="button"
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200"
                onClick={refreshCaptcha}
              >
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(AuthStep.CREDENTIALS)}
                disabled={captchaMutation.isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleCaptchaSubmit}
                disabled={!captchaToken || captchaMutation.isPending}
                className="bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
              >
                {captchaMutation.isPending ? 'Verifying...' : 'Confirm'}
              </Button>
            </div>
          </div>
        );
        
      case AuthStep.VERIFICATION:
        return (
          <form onSubmit={handleVerificationSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="text-center mb-2">
                <h3 className="text-lg font-medium">Verification Required</h3>
                <p className="text-sm text-gray-500 mt-1">
                  A verification code has been sent to your email address. Please enter it below.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(AuthStep.CAPTCHA)}
                disabled={verificationMutation.isPending}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
                disabled={!verificationCode.trim() || verificationMutation.isPending}
              >
                {verificationMutation.isPending ? 'Verifying...' : 'Verify'}
              </Button>
            </CardFooter>
          </form>
        );
        
      default:
        return null;
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
        
        {renderStepContent()}
      </Card>
    </div>
  );
};

export default Login;