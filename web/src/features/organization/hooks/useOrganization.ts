import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type {
  Department,
  DepartmentCreate,
  DepartmentUpdate,
  DepartmentTreeNode,
  DepartmentTree,
  Position,
  PositionCreate,
  PositionUpdate,
  Rank,
  RankCreate,
  RankUpdate,
} from '@shop/shared';

// ─── 部门 ────────────────────────────────────────────────────

export function useDepartmentTree() {
  return useQuery({
    queryKey: ['departments', 'tree'],
    queryFn: async () => {
      const data = await request.get<DepartmentTree>('/org/departments/tree');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentList(params?: { keyword?: string }) {
  return useQuery({
    queryKey: ['departments', 'list', params],
    queryFn: async () => {
      const data = await request.get<{ list: Department[]; total: number }>('/org/departments', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentCreate) => request.post('/org/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DepartmentUpdate }) => request.put(`/org/departments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request.delete(`/org/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

// ─── 岗位 ────────────────────────────────────────────────────

export function usePositionList(departmentId?: number) {
  return useQuery({
    queryKey: ['positions', departmentId],
    queryFn: async () => {
      const url = departmentId ? `/org/departments/${departmentId}/positions` : '/org/positions';
      const data = await request.get<{ list: Position[]; total: number }>(url);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ departmentId, data }: { departmentId: number; data: PositionCreate }) => request.post(`/org/departments/${departmentId}/positions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PositionUpdate }) => request.put(`/org/positions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request.delete(`/org/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

// ─── 职级 ────────────────────────────────────────────────────

export function useRankList() {
  return useQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const data = await request.get<{ list: Rank[] }>('/org/ranks');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateRank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RankCreate) => request.post('/org/ranks', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ranks'] }),
  });
}

export function useUpdateRank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RankUpdate }) => request.put(`/org/ranks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ranks'] }),
  });
}

export function useDeleteRank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request.delete(`/org/ranks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ranks'] }),
  });
}
