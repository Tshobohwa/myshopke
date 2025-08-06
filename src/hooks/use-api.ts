import { useState, useCallback } from "react";
import { AxiosError } from "axios";
import { ApiResponse, ApiError } from "@/lib/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiFunction(...args);
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        const errorMessage =
          axiosError.response?.data?.error?.message ||
          axiosError.message ||
          "An unexpected error occurred";

        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}

// Specialized hook for immediate API calls (on mount)
export function useApiCall<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  args: any[] = [],
  immediate = true
): UseApiReturn<T> {
  const api = useApi(apiFunction);

  useState(() => {
    if (immediate) {
      api.execute(...args);
    }
  });

  return api;
}

// Hook for managing multiple API states
export function useApiStates() {
  const [states, setStates] = useState<Record<string, UseApiState<any>>>({});

  const setApiState = useCallback(
    (key: string, state: Partial<UseApiState<any>>) => {
      setStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...state },
      }));
    },
    []
  );

  const getApiState = useCallback(
    (key: string): UseApiState<any> => {
      return states[key] || { data: null, loading: false, error: null };
    },
    [states]
  );

  const executeApi = useCallback(
    async <T>(
      key: string,
      apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
      ...args: any[]
    ): Promise<T | null> => {
      setApiState(key, { loading: true, error: null });

      try {
        const response = await apiFunction(...args);
        setApiState(key, { data: response.data, loading: false, error: null });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        const errorMessage =
          axiosError.response?.data?.error?.message ||
          axiosError.message ||
          "An unexpected error occurred";

        setApiState(key, { data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [setApiState]
  );

  return {
    states,
    getApiState,
    executeApi,
    setApiState,
  };
}
