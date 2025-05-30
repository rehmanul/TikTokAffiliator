import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter,
  Input,
  Label,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton
} from './ui';
import { BotConfig } from '../lib/types';
import { updateBotConfig } from '../lib/api';
import { queryClient } from '../lib/queryClient';

const configSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  minFollowers: z.number().min(0, 'Minimum followers must be non-negative'),
  maxFollowers: z.number().min(0, 'Maximum followers must be non-negative'),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  invitationLimit: z.number().min(0, 'Invitation limit must be non-negative'),
  actionDelay: z.number().min(1000, 'Action delay must be at least 1000ms'),
  retryAttempts: z.number().min(1, 'Retry attempts must be at least 1'),
  retryDelay: z.number().min(1000, 'Retry delay must be at least 1000ms'),
  sessionTimeout: z.number().min(5000, 'Session timeout must be at least 5000ms'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  screenshotOnError: z.boolean().default(true),
  maxDailyInvites: z.number().min(0, 'Daily invite limit must be non-negative'),
  userAgent: z.string().optional(),
  proxyUrl: z.string().optional()
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface ConfigSectionProps {
  botConfig?: BotConfig;
  isLoading: boolean;
  onConfigSaved: () => void;
  onTestLogin: () => void;
}

const ConfigSection = ({ 
  botConfig, 
  isLoading, 
  onConfigSaved,
  onTestLogin
}: ConfigSectionProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    botConfig?.categories || ['Sports & Outdoor', 'Fashion']
  );

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      email: botConfig?.email || '',
      password: botConfig?.password || '',
      minFollowers: botConfig?.minFollowers || 1000,
      maxFollowers: botConfig?.maxFollowers || 2000,
      categories: botConfig?.categories || ['Sports & Outdoor', 'Fashion'],
      invitationLimit: botConfig?.invitationLimit || 60,
      actionDelay: botConfig?.actionDelay || 2000,
      retryAttempts: botConfig?.retryAttempts || 3,
      retryDelay: botConfig?.retryDelay || 5000,
      sessionTimeout: botConfig?.sessionTimeout || 3600000,
      logLevel: botConfig?.logLevel || 'info',
      screenshotOnError: botConfig?.screenshotOnError ?? true,
      maxDailyInvites: botConfig?.maxDailyInvites || 100,
      userAgent: botConfig?.userAgent,
      proxyUrl: botConfig?.proxyUrl
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: updateBotConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      onConfigSaved();
    }
  });

  const onSubmit = (data: ConfigFormValues) => {
    // Ensure categories are properly set
    data.categories = selectedCategories;
    updateConfigMutation.mutate(data);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        const updated = prev.filter(cat => cat !== category);
        setValue('categories', updated);
        return updated;
      } else {
        const updated = [...prev, category];
        setValue('categories', updated);
        return updated;
      }
    });
  };

  const availableCategories = [
    'Sports & Outdoor',
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Beauty & Health',
    'Toys & Hobbies',
    'Automotive',
    'Pet Supplies'
  ];

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-800">Bot Configuration</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Login Settings */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Login Settings</h3>
              
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email / Phone
                </Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="email"
                    placeholder="Enter email or phone"
                    {...register('email')}
                    className="w-full"
                  />
                )}
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    {...register('password')}
                    className="w-full"
                  />
                )}
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Last successful login:{' '}
                  {isLoading ? (
                    <Skeleton className="h-4 w-20 inline-block" />
                  ) : (
                    <span className="text-gray-700">Today, 14:32</span>
                  )}
                </span>
                <Button 
                  type="button" 
                  onClick={onTestLogin}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Test Login
                </Button>
              </div>
            </div>
            
            {/* Creator Filter Settings */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Creator Filter Settings</h3>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Follower Count Range
                </Label>
                <div className="flex items-center space-x-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-10 w-full" />
                      <span className="text-gray-500">-</span>
                      <Skeleton className="h-10 w-full" />
                    </>
                  ) : (
                    <>
                      <Input
                        type="number"
                        placeholder="Min"
                        {...register('minFollowers', { valueAsNumber: true })}
                        className="w-full"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        {...register('maxFollowers', { valueAsNumber: true })}
                        className="w-full"
                      />
                    </>
                  )}
                </div>
                {(errors.minFollowers || errors.maxFollowers) && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.minFollowers?.message || errors.maxFollowers?.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Categories
                </Label>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableCategories.map((category) => (
                      <div key={category} className="flex items-center">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryChange(category)}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`cat-${category}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {errors.categories && (
                  <p className="text-xs text-red-500 mt-1">{errors.categories.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="invitationLimit" className="block text-sm font-medium text-gray-700 mb-1">
                  Invitation Limit
                </Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="invitationLimit"
                    type="number"
                    placeholder="Max invitations per day"
                    {...register('invitationLimit', { valueAsNumber: true })}
                    className="w-full"
                  />
                )}
                {errors.invitationLimit ? (
                  <p className="text-xs text-red-500 mt-1">{errors.invitationLimit.message}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Set to 0 for unlimited (not recommended)</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-md font-medium text-gray-800">Bot Behavior</h3>
                <p className="text-sm text-gray-500">Configure how the bot interacts with TikTok Shop</p>
              </div>
              <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                Advanced Settings
              </Button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="actionDelay" className="block text-sm font-medium text-gray-700 mb-1">
                  Action Delay (ms)
                </Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="actionDelay"
                    type="number"
                    placeholder="Delay between actions"
                    {...register('actionDelay', { valueAsNumber: true })}
                    className="w-full"
                  />
                )}
                {errors.actionDelay && (
                  <p className="text-xs text-red-500 mt-1">{errors.actionDelay.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="retryAttempts" className="block text-sm font-medium text-gray-700 mb-1">
                  Retry Attempts
                </Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="retryAttempts"
                    type="number"
                    placeholder="Retry attempts"
                    {...register('retryAttempts', { valueAsNumber: true })}
                    className="w-full"
                  />
                )}
                {errors.retryAttempts && (
                  <p className="text-xs text-red-500 mt-1">{errors.retryAttempts.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="logLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Log Level
                </Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={watch('logLevel')}
                    onValueChange={(value) => setValue('logLevel', value as 'debug' | 'info' | 'warn' | 'error')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select log level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {errors.logLevel && (
                  <p className="text-xs text-red-500 mt-1">{errors.logLevel.message}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="mt-6 flex justify-end space-x-3 border-t border-gray-200 p-6">
          <Button
            type="button"
            variant="outline"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={() => {
              // Reset to default values
              setValue('email', '');
              setValue('password', '');
              setValue('minFollowers', 1000);
              setValue('maxFollowers', 2000);
              setSelectedCategories(['Sports & Outdoor', 'Fashion']);
              setValue('categories', ['Sports & Outdoor', 'Fashion']);
              setValue('invitationLimit', 60);
              setValue('actionDelay', 2000);
              setValue('retryAttempts', 3);
              setValue('retryDelay', 5000);
              setValue('sessionTimeout', 3600000);
              setValue('logLevel', 'info');
              setValue('screenshotOnError', true);
              setValue('maxDailyInvites', 100);
            }}
          >
            Reset to Default
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={updateConfigMutation.isLoading}
          >
            {updateConfigMutation.isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ConfigSection;
