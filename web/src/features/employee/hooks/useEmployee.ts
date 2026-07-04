import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type {
  EmployeeListItem,
  EmployeeCreate,
  EmployeeUpdate,
  EmployeeQuery,
  Department,
  DepartmentTree,
} from '@shop/shared';

export function useEmployeeList(params: EmployeeQuery) {
  return useQuery({
    queryKey: ['employees', 'list', params],
    queryFn: async () => {
      const data = await request.get<{ list: EmployeeListItem[]; total: number }>('/employees', { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeCreate) => {
      return request.post('/employees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeUpdate }) => {
      return request.put(`/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return request.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

/** 部门树 — 供下拉选择 */
export function useDepartmentTree() {
  return useQuery({
    queryKey: ['departments', 'tree'],
    queryFn: async () => {
      const data = await request.get<DepartmentTree>('/org/departments/tree');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** 岗位列表 — 供创建/编辑时选择 */
export function usePositionList(departmentId?: number) {
  return useQuery({
    queryKey: ['positions', departmentId],
    queryFn: async () => {
      const url = departmentId
        ? `/org/departments/${departmentId}/positions`
        : '/org/positions';
      const data = await request.get<{ list: { id: number; name: string }[] }>(url);
      return data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!departmentId,
  });
}
