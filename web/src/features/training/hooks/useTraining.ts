import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type { TrainingCourse, TrainingCourseCreate, TrainingCourseQuery } from '@shop/shared';

export function useTrainingCourseList(params: TrainingCourseQuery) {
  return useQuery({
    queryKey: ['training', 'courses', params],
    queryFn: async () => request.get<{ list: TrainingCourse[]; total: number }>('/training/courses', { params }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTrainingCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TrainingCourseCreate) => request.post('/training/courses', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}

export function useDeleteTrainingCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request.delete(`/training/courses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training'] }),
  });
}
