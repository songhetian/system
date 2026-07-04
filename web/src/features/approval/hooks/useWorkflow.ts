import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowInstanceCreate,
  WorkflowApprove,
  WorkflowReject,
  TemplateNode,
  Edge,
} from '@shop/shared';

export { type WorkflowTemplate, type WorkflowInstance };

interface PaginatedResponse<T> {
  list: T[];
  total: number;
}

interface User {
  id: number;
  username: string;
  employeeName: string | null;
}

interface Role {
  id: number;
  name: string;
  code: string;
}

interface CreateTemplateData {
  name: string;
  description?: string;
  nodes: TemplateNode[];
  edges: Edge[];
}

interface UpdateTemplateData {
  id: number;
  data: Partial<CreateTemplateData>;
}

interface ReturnInstanceData {
  id: number;
  targetType: 'PREVIOUS' | 'START' | 'SPECIFIED';
  reason: string;
  targetNodeIndex?: number;
}

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: ['workflowTemplates'],
    queryFn: async () => {
      const data = await request.get<PaginatedResponse<WorkflowTemplate>>('/workflow/templates', {
        params: { page: 1, pageSize: 100 },
      });
      return data;
    },
  });
}

export function useWorkflowTemplate(id: number) {
  return useQuery({
    queryKey: ['workflowTemplate', id],
    queryFn: async () => {
      const data = await request.get<WorkflowTemplate>(`/workflow/templates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      return request.post('/workflow/templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowTemplates'] });
    },
  });
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdateTemplateData) => {
      return request.put(`/workflow/templates/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflowTemplate', id] });
      queryClient.invalidateQueries({ queryKey: ['workflowTemplates'] });
    },
  });
}

export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return request.delete(`/workflow/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowTemplates'] });
    },
  });
}

export function usePublishWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return request.post(`/workflow/templates/${id}/publish`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflowTemplate', id] });
      queryClient.invalidateQueries({ queryKey: ['workflowTemplates'] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const data = (await request.get('/users', { params: { page: 1, pageSize: 1000 } })) as unknown as PaginatedResponse<User>;
      return data.list;
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const data = (await request.get('/roles', { params: { page: 1, pageSize: 1000 } })) as unknown as PaginatedResponse<Role>;
      return data.list;
    },
  });
}

export function useWorkflowInstances() {
  return useQuery({
    queryKey: ['workflowInstances'],
    queryFn: async () => {
      const data = await request.get<PaginatedResponse<WorkflowInstance>>('/workflow/instances', {
        params: { page: 1, pageSize: 100 },
      });
      return data;
    },
  });
}

export function useWorkflowInstance(id: number) {
  return useQuery({
    queryKey: ['workflowInstance', id],
    queryFn: async () => {
      const data = await request.get<WorkflowInstance>(`/workflow/instances/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WorkflowInstanceCreate) => {
      return request.post('/workflow/instances', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] });
    },
  });
}

export function useApproveWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: number; comment?: string }) => {
      const data: WorkflowApprove = { comment };
      return request.post(`/workflow/instances/${id}/approve`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstance', id] });
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] });
    },
  });
}

export function useRejectWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const data: WorkflowReject = { reason };
      return request.post(`/workflow/instances/${id}/reject`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstance', id] });
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] });
    },
  });
}

export function useReturnWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, targetType, reason, targetNodeIndex }: ReturnInstanceData) => {
      return request.post(`/workflow/instances/${id}/return`, {
        targetType,
        reason,
        targetNodeIndex,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstance', id] });
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] });
    },
  });
}
