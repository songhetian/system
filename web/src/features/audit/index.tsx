import { useState } from 'react';
import { PageHeader, Card, Select, Tag } from '@arco-design/web-react';
import BaseTable from '@/components/BaseTable';
import styles from './index.module.css';

import { useQuery } from '@tanstack/react-query';
import request from '@/api/request';

const actionColors: Record<string, string> = { CREATE: 'green', UPDATE: 'blue', DELETE: 'red' };
const actionLabels: Record<string, string> = { CREATE: '创建', UPDATE: '更新', DELETE: '删除' };

const entityTypes = [
  'Department', 'Position', 'Rank', 'Employee', 'User', 'Role', 'Permission',
  'ShiftTemplate', 'RotationRule', 'Schedule', 'AttendanceRecord', 'AttendanceSummary',
  'LeaveQuota', 'LeaveRequest', 'OvertimeRequest', 'SalaryStructure', 'Payslip',
  'ExpenseClaim', 'TrainingCourse', 'KbDocument', 'WorkflowTemplate', 'WorkflowInstance',
  'Message', 'Announcement', 'EmployeeContract', 'EmployeeDocument',
];

function AuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();

  const params: any = { page, pageSize: 10 };
  if (entityType) params.entityType = entityType;
  if (action) params.action = action;

  const { data, isLoading } = useQuery({
    queryKey: ['audit', params],
    queryFn: async () => request.get<{ list: any[]; total: number }>('/audit', { params }),
    staleTime: 10 * 1000,
  });

  const columns = [
    { title: '用户', dataIndex: 'username', width: 100 },
    {
      title: '操作', dataIndex: 'action', width: 80,
      render: (v: string) => <Tag color={actionColors[v]}>{actionLabels[v]}</Tag>,
    },
    { title: '模块', dataIndex: 'entityType', width: 140 },
    { title: '记录ID', dataIndex: 'entityId', width: 80 },
    {
      title: '变更前', dataIndex: 'before', width: 200,
      render: (v: string) => v ? <span className={styles.varBefore}>{JSON.stringify(v).slice(0, 80)}</span> : '-',
    },
    {
      title: '变更后', dataIndex: 'after', width: 200,
      render: (v: string) => v ? <span className={styles.varAfter}>{JSON.stringify(v).slice(0, 80)}</span> : '-',
    },
    { title: '时间', dataIndex: 'createdAt', width: 170, render: (v: string) => v?.replace('T', ' ').slice(0, 19) },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="操作审计" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/操作审计', breadcrumbName: '操作审计' }] }} />
      <Card>
        <div className={styles.filterRow}>
          <Select className={styles.filterSelect} placeholder="模块类型" value={entityType} onChange={setEntityType} allowClear options={entityTypes.map(e => ({ label: e, value: e }))} />
          <Select className={styles.filterAction} placeholder="操作类型" value={action} onChange={setAction} allowClear options={[{ label: '创建', value: 'CREATE' }, { label: '更新', value: 'UPDATE' }, { label: '删除', value: 'DELETE' }]} />
        </div>
        <BaseTable columns={columns} data={data?.list || []} pagination={{ page, pageSize: 10, total: data?.total || 0, onChange: (p) => setPage(p) }} loading={isLoading} rowKey="id" />
      </Card>
    </div>
  );
}

export default AuditPage;
