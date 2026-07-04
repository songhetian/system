import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type {
  AttendanceRecord,
  AttendanceRecordCreate,
  AttendanceRecordQuery,
  AttendanceSummary,
  AttendanceSummaryGenerate,
  AttendanceSummaryQuery,
} from '@shop/shared';

export function useAttendanceRecordList(params: AttendanceRecordQuery) {
  return useQuery({
    queryKey: ['attendance', 'records', params],
    queryFn: async () => {
      const data = await request.get<{ list: AttendanceRecord[]; total: number }>('/attendance/attendance-records', { params });
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useClock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendanceRecordCreate) => {
      return request.post('/attendance/attendance-records/clock', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'records'] });
    },
  });
}

export function useAttendanceSummaryList(params: AttendanceSummaryQuery) {
  return useQuery({
    queryKey: ['attendance', 'summaries', params],
    queryFn: async () => {
      const data = await request.get<{ list: AttendanceSummary[]; total: number }>('/attendance/attendance-summaries', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateAttendanceSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendanceSummaryGenerate) => {
      return request.post('/attendance/attendance-summaries/generate', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summaries'] });
    },
  });
}

export function useLockAttendanceSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return request.post(`/attendance/attendance-summaries/${id}/lock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summaries'] });
    },
  });
}

export function useUnlockAttendanceSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return request.post(`/attendance/attendance-summaries/${id}/unlock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summaries'] });
    },
  });
}
