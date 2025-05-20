import { useState } from 'react';
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
  AlertDescription
} from '@/components/ui';
import { useMutation } from '@tanstack/react-query';

// Mock login function - in a real app, this would be replaced with a real API call
const performLogin = async (credentials: { email: string; password: string }) => {
  // Simulating API call
  return new Promise<{ success: boolean, message?: string }>((resolve) => {
    setTimeout(() => {
      // Check for our hardcoded credentials
      if (credentials.email === 'rehman.shoj2@gmail.com' && credentials.password === 'Rehm@n998088') {
        resolve({ success: true });
      } else {
        resolve({ 
          success: false, 
          message: 'Invalid credentials. Please try again.'
        });
      }
    }, 1000);
  });
};

const Login = () => {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('rehman.shoj2@gmail.com');
  const [password, setPassword] = useState('Rehm@n998088');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: performLogin,
    onSuccess: (data) => {
      if (data.success) {
        // Navigate to dashboard on successful login
        setLocation('/');
        
        // In a real application, you would also store the authentication token
        localStorage.setItem('isLoggedIn', 'true');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    },
    onError: () => {
      setError('An unexpected error occurred. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    
    loginMutation.mutate({ email, password });
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
      </Card>
    </div>
  );
};

export default Login;