import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input
} from '@/components/ui';
import { X } from 'lucide-react';
import { submitVerificationCode } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const VerificationModal = ({ isOpen, onClose, onSubmit }: VerificationModalProps) => {
  const [code, setCode] = useState('');
  
  const verificationMutation = useMutation({
    mutationFn: (verificationCode: string) => submitVerificationCode(verificationCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      onSubmit();
      setCode('');
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      verificationMutation.mutate(code);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
        <DialogHeader className="flex justify-between items-center mb-4">
          <DialogTitle className="text-lg font-medium text-gray-900">Verification Required</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-gray-500" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-3">
              A verification code has been sent to your email. Please enter it below:
            </p>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-tiktok-teal focus:border-tiktok-teal text-center text-lg tracking-widest"
              placeholder="Enter verification code"
              maxLength={6}
            />
          </div>
          
          <DialogFooter className="flex justify-end space-x-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
              disabled={!code.trim() || verificationMutation.isPending}
            >
              {verificationMutation.isPending ? 'Submitting...' : 'Submit Code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;
