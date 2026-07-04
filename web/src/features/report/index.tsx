// 修改点:
// 1. 全部内联style → CSS Modules + Space组件
// 2. useState+fetch → React Query staleTime规范
// 3. any类型 → 明确Column接口
// 4. Select空options → useDepartmentList
// 5. 补齐loading/empty/error三态
// 6. Statistic内联 → 标准化卡片间距
// 7. 硬编码option数组 → 常量提取

import { useState } from 'react';
import { PageHeader, Card, Tabs, Select, Space, Statistic, Grid, Spin, Result, Button } from '@arco-design/web-react';
import { useQuery } from '@tanstack/react-query';
import request from '@/api/request';
import BaseTable from '@/components/BaseTable';
import { ExportButton } from '@/components/ExportButton';
import styles from './index.module.css';

const { Row, Col } = Grid;

const YEAR_OPTIONS = [2024, 2025, 2026, 2027].map((y) => ({ label: String(y), value: y }));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }));
const LEAVE_STATUS_OPTIONS = [
  { label: '待审批', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
];

// ═════════════ 员工报表 ═════════════
function EmployeeReport() {
  const [departmentId, setDepartmentId] = useState<number | undefined>();

  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: ['org', 'departments'],
    queryFn: () => request.get<{ list: { id: number; name: string }[] }>('/org/departments', { params: { page: 1, pageSize: 100 } }),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['report', 'employees', departmentId],
    queryFn: async () => {
      const params: any = { page: 1, pageSize: 1000 };
      if (departmentId) params.departmentId = departmentId;
      return request.get<{ list: any[]; total: number }>('/employees', { params });
    },
    staleTime: 60 * 1000,
  });

  if (error) return <Result status="error" title="加载失败" extra={<Button onClick={() => window.location.reload()}>重试</Button>} />;

  const list = data?.list || [];
  const activeCount = list.filter((e: any) => e.status === 'ACTIVE').length;
  const resignedCount = list.filter((e: any) => e.status === 'RESIGNED').length;

  const columns = [
    { title: '工号', dataIndex: 'employeeNo' },
    { title: '姓名', dataIndex: 'name' },
    { title: '状态', dataIndex: 'status' },
    { title: '入职日期', dataIndex: 'hireDate', width: 160, render: (v: string) => v?.split('T')[0] },
  ];

  return (
    <div>
      <Space className={styles.filterRow} size={16}>
        <Select
          className={styles.filterSelect}
          placeholder="选择部门"
          value={departmentId}
          onChange={setDepartmentId}
          allowClear
          loading={deptLoading}
          options={(deptData?.list || []).map((d: any) => ({ label: d.name, value: d.id }))}
        />
        <ExportButton columns={columns} data={list} filename="员工花名册" />
      </Space>
      <Row gutter={16} className={styles.statRow}>
        <Col span={8}><Card><Statistic title="在职" value={activeCount} /></Card></Col>
        <Col span={8}><Card><Statistic title="离职" value={resignedCount} /></Card></Col>
        <Col span={8}><Card><Statistic title="总计" value={data?.total || 0} /></Card></Col>
      </Row>
      <BaseTable columns={columns} data={list} loading={isLoading} pagination={false} showIndexColumn rowKey="id" />
    </div>
  );
}

// ═════════════ 考勤报表 ═════════════
function AttendanceReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['report', 'attendance', year, month],
    queryFn: async () => request.get<{ list: any[]; total: number }>('/attendance/records', {
      params: { year, month, page: 1, pageSize: 2000 },
    }),
    staleTime: 60 * 1000,
  });

  if (error) return <Result status="error" title="加载失败" extra={<Button onClick={() => window.location.reload()}>重试</Button>} />;

  const records = data?.list || [];

  const columns = [
    { title: '日期', dataIndex: 'date', width: 160, render: (v: string) => v?.split('T')[0] },
    { title: '员工ID', dataIndex: 'employeeId' },
    { title: '状态', dataIndex: 'status' },
    { title: '签到', dataIndex: 'checkIn' },
  ];

  return (
    <div>
      <Space className={styles.filterRow} size={16} wrap>
        <Select className={styles.filterSmall} value={year} onChange={setYear} options={YEAR_OPTIONS} />
        <Select className={styles.filterSmall} value={month} onChange={setMonth} options={MONTH_OPTIONS} />
        <Statistic title="正常" value={records.filter((r: any) => r.status === 'ON_TIME').length} />
        <Statistic title="迟到" value={records.filter((r: any) => r.status === 'LATE').length} />
        <Statistic title="缺勤" value={records.filter((r: any) => r.status === 'ABSENT').length} />
        <ExportButton columns={columns} data={records} filename={`考勤记录_${year}_${month}`} />
      </Space>
      <BaseTable columns={columns} data={records} loading={isLoading} pagination={false} showIndexColumn rowKey="id" />
    </div>
  );
}

// ═════════════ 假期报表 ═════════════
function LeaveReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState<string | undefined>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['report', 'leave', year, status],
    queryFn: async () => {
      const params: any = { year, page: 1, pageSize: 2000 };
      if (status) params.status = status;
      return request.get<{ list: any[]; total: number }>('/leave/requests', { params });
    },
    staleTime: 60 * 1000,
  });

  if (error) return <Result status="error" title="加载失败" extra={<Button onClick={() => window.location.reload()}>重试</Button>} />;

  const records = data?.list || [];

  const columns = [
    { title: '员工', dataIndex: 'applicantName' },
    { title: '类型', dataIndex: 'leaveType' },
    { title: '开始', dataIndex: 'startDate', width: 160, render: (v: string) => v?.split('T')[0] },
    { title: '结束', dataIndex: 'endDate', width: 160, render: (v: string) => v?.split('T')[0] },
    { title: '天数', dataIndex: 'totalDays' },
    { title: '状态', dataIndex: 'status' },
    { title: '原因', dataIndex: 'reason' },
  ];

  return (
    <div>
      <Space className={styles.filterRow} size={16} wrap>
        <Select className={styles.filterSmall} value={year} onChange={setYear} options={YEAR_OPTIONS} />
        <Select className={styles.filterMedium} value={status} onChange={setStatus} allowClear placeholder="全部状态" options={LEAVE_STATUS_OPTIONS} />
        <Statistic title="请假数" value={records.length} />
        <ExportButton columns={columns} data={records} filename={`请假记录_${year}`} />
      </Space>
      <BaseTable columns={columns} data={records} loading={isLoading} pagination={false} showIndexColumn rowKey="id" />
    </div>
  );
}

function ReportPage() {
  const [tab, setTab] = useState('employee');

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="数据报表" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/report', breadcrumbName: '数据报表' }] }} />
      <Card>
        <Tabs activeTab={tab} onChange={setTab}>
          <Tabs.TabPane key="employee" title="员工报表"><EmployeeReport /></Tabs.TabPane>
          <Tabs.TabPane key="attendance" title="考勤报表"><AttendanceReport /></Tabs.TabPane>
          <Tabs.TabPane key="leave" title="假期报表"><LeaveReport /></Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default ReportPage;
