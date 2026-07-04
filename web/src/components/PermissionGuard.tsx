import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import NotFound from '@/pages/NotFound';

interface Props {
  permission: string;
  children: ReactNode;
}

/**
 * 路由级权限守卫。用户缺少指定权限时显示 403。
 * Usage: <PermissionGuard permission="employee:read"><EmployeePage /></PermissionGuard>
 */
export function PermissionGuard({ permission, children }: Props) {
  const permissions = useAuthStore((s) => s.permissions);
  if (!permissions || permissions.length === 0) return <>{children}</>;
  const hasPermission = permissions.includes('admin:all') || permissions.includes(permission);
  if (!hasPermission) return <NotFound />;
  return <>{children}</>;
}
