/**
 * React hooks for API calls
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/api';
import type {
  ConnectionTestRequest,
  SchemaRequest,
  ChatRequest,
  QueryExecuteRequest,
} from '../utils/api';

export const useTestConnection = () => {
  return useMutation({
    mutationFn: (data: ConnectionTestRequest) => apiClient.testConnection(data),
  });
};

export const useExtractSchema = () => {
  return useMutation({
    mutationFn: (data: SchemaRequest) => apiClient.extractSchema(data),
  });
};

export const useGenerateSQL = () => {
  return useMutation({
    mutationFn: (data: ChatRequest) => apiClient.generateSQL(data),
  });
};

export const useExecuteQuery = () => {
  return useMutation({
    mutationFn: (data: QueryExecuteRequest) => apiClient.executeQuery(data),
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 10000, // Check every 10 seconds
    retry: false,
  });
};

