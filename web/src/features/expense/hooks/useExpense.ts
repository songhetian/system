import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type { ExpenseClaim, ExpenseClaimCreate, ExpenseClaimQuery } from '@shop/shared';

export function useExpenseClaimList(params: ExpenseClaimQuery) {
  return useQuery({
    queryKey: ['expense', 'claims', params],
    queryFn: async () => request.get<{ list: ExpenseClaim[]; total: number }>('/expense/claims', { params }),
    staleTime: 60 * 1000,
  });
}

export function useCreateExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseClaimCreate) => request.post('/expense/claims', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense'] }),
  });
}

export function useSubmitExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request.post(`/expense/claims/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense'] }),
  });
}
