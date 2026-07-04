import { useState } from 'react';
import { PageHeader, Card, Button, Message, Modal, Tag, Form, Input, Select } from '@arco-design/web-react';
import { IconPlus, IconDelete } from '@arco-design/web-react/icon';
import BaseTable from '@/components/BaseTable';
import { useTrainingCourseList, useCreateTrainingCourse, useDeleteTrainingCourse } from './hooks/useTraining';
import styles from './index.module.css';

const statusColors: Record<string, string> = { UPCOMING: 'blue', IN_PROGRESS: 'orange', COMPLETED: 'green', CANCELLED: 'gray' };
const statusLabels: Record<string, string> = { UPCOMING: '即将开始', IN_PROGRESS: '进行中', COMPLETED: '已完成', CANCELLED: '已取消' };
const typeLabels: Record<string, string> = { ONLINE: '线上', OFFLINE: '线下' };

function TrainingPage() {
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const params = { page, pageSize: 10 };
  const { data, isLoading } = useTrainingCourseList(params as any);
  const createMutation = useCreateTrainingCourse();
  const deleteMutation = useDeleteTrainingCourse();

  const handleCreate = async (values: any) => {
    try { await createMutation.mutateAsync(values); Message.success('创建成功'); setModalVisible(false); } catch { Message.error('创建失败'); }
  };

  const columns = [
    { title: '课程名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 80, render: (v: string) => typeLabels[v] || v },
    { title: '讲师', dataIndex: 'trainer', width: 100 },
    { title: '开始日期', dataIndex: 'startDate', width: 120 },
    { title: '结束日期', dataIndex: 'endDate', width: 120 },
    { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
    {
      title: '操作', key: 'actions', width: 80,
      render: (_: any, r: any) => (
        <Button size="small" icon={<IconDelete />} status="danger" onClick={() => {
          Modal.confirm({ title: '确认删除', content: `删除课程「${r.name}」？`, onOk: () => deleteMutation.mutateAsync(r.id).then(() => Message.success('已删除')).catch(() => Message.error('删除失败')) });
        }} />
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="培训管理" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/training', breadcrumbName: '培训管理' }] }} />
      <Card extra={<Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>新增课程</Button>}>
        <BaseTable columns={columns} data={data?.list || []} pagination={{ page, pageSize: 10, total: data?.total || 0, onChange: (p) => setPage(p) }} loading={isLoading} showIndexColumn rowKey="id" />
      </Card>
      <Modal
        title="新增课程"
        visible={modalVisible}
        onOk={handleCreate}
        onCancel={() => setModalVisible(false)}
        confirmLoading={createMutation.isPending}
      >
        <Form.Item label="课程名称" field="name" rules={[{ required: true }]}><Input placeholder="请输入课程名称" /></Form.Item>
        <Form.Item label="类型" field="type" rules={[{ required: true }]}><Select options={[{ label: '线上', value: 'ONLINE' }, { label: '线下', value: 'OFFLINE' }]} /></Form.Item>
        <Form.Item label="讲师" field="trainer"><Input placeholder="讲师姓名" /></Form.Item>
        <Form.Item label="开始日期" field="startDate" rules={[{ required: true }]}><Input placeholder="YYYY-MM-DD" /></Form.Item>
        <Form.Item label="结束日期" field="endDate" rules={[{ required: true }]}><Input placeholder="YYYY-MM-DD" /></Form.Item>
        <Form.Item label="地点" field="location"><Input placeholder="培训地点" /></Form.Item>
        <Form.Item label="最大人数" field="maxAttendees"><Input placeholder="不限则留空" /></Form.Item>
      </Modal>
    </div>
  );
}

export default TrainingPage;
