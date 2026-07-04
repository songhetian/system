import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type {
  LeaveQuota,
  LeaveQuotaInit,
  LeaveQuotaQuery,
  LeaveRequestListItem,
  LeaveRequestCreate,
  LeaveRequestUpdate,
  LeaveRequestQuery,
  LeaveApproval,
  LeaveRejection,
} from '@shop/shared';

export function useLeaveQuotaList(params: LeaveQuotaQuery) {
  return useQuery({
    queryKey: ['leave', 'quotas', params],
    queryFn: async () => {
      const data = await request.get<{ list: LeaveQuota[]; total: number }>('/leave/leave-quotas', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInitLeaveQuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveQuotaInit) => {
      return request.post('/leave/leave-quotas/init', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'quotas'] });
    },
  });
}

export function useUpdateLeaveQuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LeaveQuota> }) => {
      return request.put(`/leave/leave-quotas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'quotas'] });
    },
  });
}

export function useLeaveRequestList(params: LeaveRequestQuery) {
  return useQuery({
    queryKey: ['leave', 'requests', params],
    queryFn: async () => {
      const data = await request.get<{ list: LeaveRequestListItem[]; total: number }>('/leave/leave-requests', { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveRequestCreate) => {
      return request.post('/leave/leave-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaveRequestUpdate }) => {
      return request.put(`/leave/leave-requests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaveApproval }) => {
      return request.post(`/leave/leave-requests/${id}/approve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'quotas'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaveRejection }) => {
      return request.post(`/leave/leave-requests/${id}/reject`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return request.post(`/leave/leave-requests/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
    },
  });
}
