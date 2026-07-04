import { useState } from 'react';
import { PageHeader, Card, Button, Space, Message, Modal, Tag, Form, Input, Select, InputNumber } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import BaseTable from '@/components/BaseTable';
import BaseFormModal from '@/components/BaseFormModal';
import { useExpenseClaimList, useCreateExpenseClaim, useSubmitExpenseClaim } from './hooks/useExpense';
import styles from './index.module.css';

const statusColors: Record<string, string> = { DRAFT: 'gray', PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };
const statusLabels: Record<string, string> = { DRAFT: '草稿', PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝' };
const typeLabels: Record<string, string> = { TRAVEL: '差旅', OFFICE: '办公', ENTERTAINMENT: '招待', OTHER: '其他' };

function ExpensePage() {
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const params = { page, pageSize: 10 };
  const { data, isLoading } = useExpenseClaimList(params as any);
  const createMutation = useCreateExpenseClaim();
  const submitMutation = useSubmitExpenseClaim();

  const handleCreate = async (values: any) => {
    try { await createMutation.mutateAsync(values); Message.success('创建成功'); setModalVisible(false); } catch { Message.error('创建失败'); }
  };

  const columns = [
    { title: '标题', dataIndex: 'title' },
    { title: '类型', dataIndex: 'expenseType', width: 80, render: (v: string) => typeLabels[v] || v },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: any) => `¥${Number(v).toFixed(2)}` },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
    { title: '提交时间', dataIndex: 'createdAt', width: 160, render: (v: string) => v?.split('T')[0] },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_: any, r: any) => r.status === 'DRAFT' ? (
        <Button size="small" type="primary" onClick={() => submitMutation.mutateAsync(r.id).then(() => Message.success('已提交')).catch(() => Message.error('提交失败'))}>提交</Button>
      ) : null,
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="报销管理" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/报销管理', breadcrumbName: '报销管理' }] }} />
      <Card extra={<Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>新增报销</Button>}>
        <BaseTable columns={columns} data={data?.list || []} pagination={{ page, pageSize: 10, total: data?.total || 0, onChange: (p) => setPage(p) }} loading={isLoading} showIndexColumn rowKey="id" />
      </Card>
      <BaseFormModal visible={modalVisible} title="新增报销" onCancel={() => setModalVisible(false)} onSubmit={handleCreate}>
        <Form.Item label="标题" field="title" rules={[{ required: true }]}><Input placeholder="请输入报销标题" /></Form.Item>
        <Form.Item label="类型" field="expenseType" rules={[{ required: true }]}><Select options={Object.entries(typeLabels).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item>
        <Form.Item label="金额" field="amount" rules={[{ required: true }]}><InputNumber placeholder="请输入金额" min={0.01} precision={2} /></Form.Item>
        <Form.Item label="描述" field="description"><Input.TextArea placeholder="报销说明" /></Form.Item>
      </BaseFormModal>
    </div>
  );
}

export default ExpensePage;
