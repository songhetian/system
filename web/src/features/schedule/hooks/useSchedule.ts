import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type {
  ShiftTemplate,
  ShiftTemplateCreate,
  ShiftTemplateUpdate,
  RotationRule,
  RotationRuleCreate,
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  ScheduleQuery,
  ScheduleGenerateInput,
  ScheduleConflict,
} from '@shop/shared';

export function useShiftTemplateList() {
  return useQuery({
    queryKey: ['schedule', 'shift-templates'],
    queryFn: async () => {
      const data = await request.get<ShiftTemplate[]>('/schedule/shift-templates');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateShiftTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShiftTemplateCreate) => {
      return request.post('/schedule/shift-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'shift-templates'] });
    },
  });
}

export function useUpdateShiftTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShiftTemplateUpdate }) => {
      return request.put(`/schedule/shift-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'shift-templates'] });
    },
  });
}

export function useDeleteShiftTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return request.delete(`/schedule/shift-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'shift-templates'] });
    },
  });
}

export function useRotationRuleList() {
  return useQuery({
    queryKey: ['schedule', 'rotation-rules'],
    queryFn: async () => {
      const data = await request.get<RotationRule[]>('/schedule/rotation-rules');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRotationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RotationRuleCreate) => {
      return request.post('/schedule/rotation-rules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'rotation-rules'] });
    },
  });
}

export function useUpdateRotationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RotationRuleCreate }) => {
      return request.put(`/schedule/rotation-rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'rotation-rules'] });
    },
  });
}

export function useDeleteRotationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return request.delete(`/schedule/rotation-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'rotation-rules'] });
    },
  });
}

export function useScheduleList(params: ScheduleQuery) {
  return useQuery({
    queryKey: ['schedule', 'schedules', params],
    queryFn: async () => {
      const data = await request.get<Schedule[]>('/schedule/schedules', { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleCreate) => {
      return request.post('/schedule/schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ScheduleUpdate }) => {
      return request.put(`/schedule/schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return request.delete(`/schedule/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'schedules'] });
    },
  });
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleGenerateInput) => {
      return request.post('/schedule/schedules/generate', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'schedules'] });
    },
  });
}

export function useCheckScheduleConflicts(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ['schedule', 'conflicts', params],
    queryFn: async () => {
      const data = await request.get<ScheduleConflict[]>('/schedule/schedules/conflicts', { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
}
