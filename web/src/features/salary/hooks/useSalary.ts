import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import type {
  PayslipListItem,
  PayslipQuery,
  PayslipGenerate,
  SalaryStructure,
  SalaryStructureCreate,
  SalaryAuditLog,
  SalaryAuditLogQuery,
} from '@shop/shared';

export function usePayslipList(params: PayslipQuery) {
  return useQuery({
    queryKey: ['salary', 'payslips', params],
    queryFn: async () => {
      const data = await request.get<{ list: PayslipListItem[]; total: number }>('/salary/payslips', { params });
      return data;
    },
    staleTime: 0,
  });
}

export function usePayslipDetail(id: number, salaryToken: string) {
  return useQuery({
    queryKey: ['salary', 'payslip', id],
    queryFn: async () => {
      const data = await request.get(`/salary/payslips/${id}`, {
        headers: { 'X-Salary-Token': salaryToken },
      });
      return data as any;
    },
    enabled: !!id && !!salaryToken,
    staleTime: 0,
  });
}

export function useGeneratePayslips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PayslipGenerate) => request.post('/salary/payslips/generate', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salary'] }),
  });
}

export function useVerifySalaryPassword() {
  return useMutation({
    mutationFn: (password: string) => request.post('/salary-password/verify', { password }),
  });
}

export function useSalaryStructureList() {
  return useQuery({
    queryKey: ['salary', 'structures'],
    queryFn: async () => request.get<{ list: SalaryStructure[]; total: number }>('/salary/structures'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SalaryStructureCreate) => request.post('/salary/structures', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salary'] }),
  });
}

export function useDeleteSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request.delete(`/salary/structures/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salary'] }),
  });
}

export function useSalaryAuditLogs(params: SalaryAuditLogQuery) {
  return useQuery({
    queryKey: ['salary', 'audit', params],
    queryFn: async () => request.get<{ list: SalaryAuditLog[]; total: number }>('/salary/audit-logs', { params }),
    staleTime: 0,
  });
}
