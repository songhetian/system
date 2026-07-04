import { useState } from 'react';
import {
  PageHeader,
  Card,
  Tabs,
  Button,
  Message,
  Tag,
  Modal,
} from '@arco-design/web-react';
import { IconEye, IconPlus } from '@arco-design/web-react/icon';
import BaseTable from '@/components/BaseTable';
import BaseSalaryPwdModal from '@/components/BaseSalaryPwdModal';
import {
  usePayslipList,
  usePayslipDetail,
  useGeneratePayslips,
  useVerifySalaryPassword,
  useSalaryStructureList,
  useSalaryAuditLogs as useAuditLogs,
} from './hooks/useSalary';
import styles from './index.module.css';

function SalaryPage() {
  const [activeTab, setActiveTab] = useState('payslips');
  const [page, setPage] = useState(1);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [salaryToken, setSalaryToken] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [auditPage, setAuditPage] = useState(1);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const params = { page, pageSize: 10, year: currentYear, month: currentMonth };
  const { data: payslipData, isLoading: payslipLoading } = usePayslipList(params as any);
  const { data: structureData, isLoading: structureLoading } = useSalaryStructureList();
  const { data: auditData, isLoading: auditLoading } = useAuditLogs({ page: auditPage, pageSize: 10 } as any);

  const { data: payslipDetail } = usePayslipDetail(detailId!, salaryToken);
  const verifyPwd = useVerifySalaryPassword();
  const generateMutation = useGeneratePayslips();


  const handleViewDetail = (record: Record<string, unknown>) => {
    setDetailId(record.id as number);
    setPwdVisible(true);
  };

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({ year: currentYear, month: currentMonth, departmentId: null });
      Message.success('工资条生成成功');
    } catch {
      Message.error('生成失败');
    }
  };

  const payslipColumns = [
    { title: '姓名', dataIndex: 'employeeName', width: 100 },
    { title: '部门', dataIndex: 'departmentName', width: 120 },
    { title: '月份', dataIndex: 'month', width: 80, render: (_: any, r: any) => `${r.year}-${String(r.month).padStart(2, '0')}` },
    { title: '应发', dataIndex: 'grossPay', width: 120 },
    { title: '扣款', dataIndex: 'deductions', width: 120 },
    { title: '实发', dataIndex: 'netPay', width: 120 },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_: any, record: any) => (
        <Button size="small" icon={<IconEye />} onClick={() => handleViewDetail(record)}>
          查看
        </Button>
      ),
    },
  ];

  const structureColumns = [
    { title: '结构名称', dataIndex: 'name' },
    { title: '薪资项数', dataIndex: 'items', render: (v: any[]) => v?.length || 0 },
    { title: '创建时间', dataIndex: 'createdAt', render: (v: string) => v?.split('T')[0] || v },
  ];

  const auditColumns = [
    { title: '用户', dataIndex: 'username', width: 100 },
    {
      title: '操作', dataIndex: 'action', width: 160,
      render: (v: string) => {
        const map: Record<string, string> = {
          VIEW_SALARY: '查看薪资', EXPORT_SALARY: '导出薪资',
          VERIFY_PASSWORD_SUCCESS: '密码验证成功', VERIFY_PASSWORD_FAIL: '密码验证失败',
        };
        return map[v] || v;
      },
    },
    { title: 'IP', dataIndex: 'ip', width: 140 },
    { title: '时间', dataIndex: 'createdAt', render: (v: string) => v?.split('T')[0] + ' ' + v?.split('T')[1]?.split('.')[0] },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="薪资管理" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/salary', breadcrumbName: '薪资管理' }] }} />
      <Card>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane key="payslips" title="工资条">
            <Card
              className={styles.actionBar}
              extra={<Button type="primary" icon={<IconPlus />} onClick={handleGenerate} loading={generateMutation.isPending}>生成本月工资条</Button>}
            />
            <BaseTable
              columns={payslipColumns}
              data={payslipData?.list || []}
              pagination={{ page, pageSize: 10, total: payslipData?.total || 0, onChange: (p) => setPage(p) }}
              loading={payslipLoading}
              showIndexColumn
              rowKey="id"
            />
          </Tabs.TabPane>

          <Tabs.TabPane key="structures" title="薪资结构">
            <BaseTable
              columns={structureColumns}
              data={structureData?.list || []}
              loading={structureLoading}
              pagination={false}
              rowKey="id"
            />
          </Tabs.TabPane>

          <Tabs.TabPane key="audit" title="操作审计">
            <BaseTable
              columns={auditColumns}
              data={auditData?.list || []}
              pagination={{ page: auditPage, pageSize: 10, total: auditData?.total || 0, onChange: (p) => setAuditPage(p) }}
              loading={auditLoading}
              rowKey="id"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <BaseSalaryPwdModal
        visible={pwdVisible}
        onClose={() => setPwdVisible(false)}
        onVerify={async (password) => {
          try {
            const res: Record<string, unknown> = await verifyPwd.mutateAsync(password) as unknown as Record<string, unknown>;
            setSalaryToken((res?.token as string) || '');
            setPwdVisible(false);
            Message.success('验证通过');
            return true;
          } catch {
            Message.error('密码错误');
            return false;
          }
        }}
      />

      <Modal
        title="工资条详情"
        visible={!!payslipDetail && !pwdVisible && !!salaryToken}
        onCancel={() => setDetailId(null)}
        footer={<Button onClick={() => setDetailId(null)}>关闭</Button>}
      >
        {payslipDetail && (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = payslipDetail as any;
          return (
          <div>
            <p><strong>姓名：</strong>{String(d.employeeName)}</p>
            <p><strong>部门：</strong>{String(d.departmentName)}</p>
            <p><strong>岗位：</strong>{String(d.positionName)}</p>
            <p><strong>月份：</strong>{String(d.year)}-{String(d.month).padStart(2, '0')}</p>
            <hr />
            {((d.items as any[]) || []).map((item: any, i: number) => (
              <p key={i}><Tag>{item.name}</Tag> ¥{item.amount}</p>
            ))}
            <hr />
            <p><strong>应发合计：</strong>¥{String(d.grossPay)}</p>
            <p><strong>扣款合计：</strong>¥{String(d.deductions)}</p>
            <p><strong>实发合计：</strong>¥{String(d.netPay)}</p>
          </div>
        ); })()}
      </Modal>
    </div>
  );
}

export default SalaryPage;
