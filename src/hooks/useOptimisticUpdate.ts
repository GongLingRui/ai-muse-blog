import { useState, useCallback } from "react";

interface OptimisticState<T> {
  data: T | null;
  isPending: boolean;
  error: Error | null;
}

export const useOptimisticUpdate = <T>(
  initialData: T | null,
  mutationFn: (variables: any) => Promise<T>
) => {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
  });

  const execute = useCallback(
    async (optimisticData: T, variables: any) => {
      // Set optimistic state
      setState({
        data: optimisticData,
        isPending: true,
        error: null,
      });

      try {
        // Execute actual mutation
        const result = await mutationFn(variables);

        setState({
          data: result,
          isPending: false,
          error: null,
        });

        return result;
      } catch (error) {
        setState({
          data: initialData,
          isPending: false,
          error: error as Error,
        });

        throw error;
      }
    },
    [mutationFn, initialData]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isPending: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
};

// Simplified hook for toggle-like optimistic updates
export const useOptimisticToggle = () => {
  const [state, setState] = useState<{
    currentValue: boolean;
    isPending: boolean;
  }>({
    currentValue: false,
    isPending: false,
  });

  const toggle = useCallback(
    async (current: boolean, mutationFn: () => Promise<void>) => {
      // Optimistic update
      setState({
        currentValue: !current,
        isPending: true,
      });

      try {
        await mutationFn();
        setState({
          currentValue: !current,
          isPending: false,
        });
      } catch (error) {
        // Rollback on error
        setState({
          currentValue: current,
          isPending: false,
        });
        throw error;
      }
    },
    []
  );

  return { ...state, toggle };
};

// Optimistic counter (for likes, bookmarks count)
export const useOptimisticCounter = (initialCount: number) => {
  const [state, setState] = useState<{
    count: number;
    isPending: boolean;
  }>({
    count: initialCount,
    isPending: false,
  });

  const increment = useCallback(async (mutationFn: () => Promise<number>) => {
    setState((prev) => ({
      count: prev.count + 1,
      isPending: true,
    }));

    try {
      const newCount = await mutationFn();
      setState({
        count: newCount,
        isPending: false,
      });
    } catch (error) {
      setState((prev) => ({
        count: prev.count - 1,
        isPending: false,
      }));
      throw error;
    }
  }, []);

  const decrement = useCallback(async (mutationFn: () => Promise<number>) => {
    setState((prev) => ({
      count: Math.max(0, prev.count - 1),
      isPending: true,
    }));

    try {
      const newCount = await mutationFn();
      setState({
        count: newCount,
        isPending: false,
      });
    } catch (error) {
      setState((prev) => ({
        count: prev.count + 1,
        isPending: false,
      }));
      throw error;
    }
  }, []);

  return { ...state, increment, decrement };
};
