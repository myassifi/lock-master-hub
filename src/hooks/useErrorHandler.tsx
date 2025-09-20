import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseErrorHandlerReturn {
  isLoading: boolean;
  error: string | null;
  executeAsync: <T>(
    operation: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<T | null>;
  clearError: () => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const executeAsync = async <T,>(
    operation: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      
      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
          duration: 3000,
        });
      }
      
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      const errorMessage = options.errorMessage || error.message;
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isLoading,
    error,
    executeAsync,
    clearError,
  };
}