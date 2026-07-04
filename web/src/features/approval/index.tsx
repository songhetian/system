// 修改点：1. lucide→Arco图标 2. 移除未使用Dropdown/Menu 3. any→具体类型 4. Tabs activeKey→activeTab 5. useWorkflow返回data解构 6. 新增PageHeader 7. tailwind→CSS Module
import { useState } from 'react';
import {
  PageHeader,
  Card,
  Tabs,
  Button,
  Space,
  Tag,
  Message,
  Modal,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconEye,
  IconPlayCircle,
  IconCheck,
  IconClose,
  IconRefresh,
} from '@arco-design/web-react/icon';
import {
  useWorkflowTemplates,
  useDeleteWorkflowTemplate,
  useWorkflowInstances,
  useApproveWorkflowInstance,
  useRejectWorkflowInstance,
} from './hooks/useWorkflow';
import BaseTable from '@/components/BaseTable';
import TemplateEditor from './components/TemplateEditor';
import styles from './index.module.css';
import type { WorkflowTemplate, WorkflowInstance } from '@shop/shared';
import { useAuthStore } from '@/store/auth';

type StatusKey = 'DRAFT' | 'PUBLISHED' | 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const statusColors: Record<StatusKey, string> = {
  DRAFT: 'orange',
  PUBLISHED: 'green',
  PENDING: 'orange',
  IN_PROGRESS: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

const statusLabels: Record<StatusKey, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  PENDING: '待审批',
  IN_PROGRESS: '审批中',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  CANCELLED: '已取消',
};

function Approval() {
  const [activeTab, setActiveTab] = useState('templates');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [templatesPage, setTemplatesPage] = useState(1);
  const [instancesPage, setInstancesPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);

  const { data: templatesRes, isLoading: templatesLoading, refetch: refetchTemplates } =
    useWorkflowTemplates();
  const { data: instancesRes, isLoading: instancesLoading, refetch: refetchInstances } =
    useWorkflowInstances();

  const templates = templatesRes?.list || [];
  const instances = instancesRes?.list || [];

  const deleteMutation = useDeleteWorkflowTemplate();
  const approveMutation = useApproveWorkflowInstance();
  const rejectMutation = useRejectWorkflowInstance();

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: WorkflowTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleDeleteTemplate = (record: WorkflowTemplate) => {
    Modal.confirm({
      title: '删除模板',
      content: `确定要删除模板「${record.name}」吗？`,
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id);
          Message.success('删除成功');
          refetchTemplates();
        } catch {
          Message.error('删除失败');
        }
      },
    });
  };

  const handleApprove = (record: WorkflowInstance) => {
    Modal.confirm({
      title: '审批通过',
      content: `确定要通过「${record.subject}」的审批吗？`,
      onOk: () =>
        approveMutation.mutateAsync({ id: record.id }).then(() => {
          Message.success('审批通过');
          refetchInstances();
        }),
    });
  };

  const handleReject = (record: WorkflowInstance) => {
    Modal.confirm({
      title: '拒绝申请',
      content: `确定要拒绝「${record.subject}」的申请吗？`,
      onOk: () =>
        rejectMutation.mutateAsync({ id: record.id, reason: '审批拒绝' }).then(() => {
          Message.success('已拒绝');
          refetchInstances();
        }),
    });
  };

  const handleReturn = (record: WorkflowInstance) => {
    Modal.confirm({
      title: '退回申请',
      content: `确定要退回「${record.subject}」到上一级吗？`,
      onOk: async () => {
        const token = useAuthStore.getState().token;
        const res = await fetch(`/api/workflow/instances/${record.id}/return`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ targetType: 'PREVIOUS', reason: '退回修改' }),
        });
        if (!res.ok) throw new Error('退回失败');
        Message.success('已退回');
        refetchInstances();
      },
    });
  };

  const templateColumns = [
    { title: '名称', dataIndex: 'name', width: 200 },
    { title: '描述', dataIndex: 'description', width: 200 },
    {
      title: '节点数',
      dataIndex: 'nodes',
      width: 100,
      render: (nodes: WorkflowTemplate['nodes']) => nodes?.length || 0,
    },
    { title: '版本', dataIndex: 'version', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: StatusKey) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: WorkflowTemplate) => (
        <Space size={8}>
          <Button size="small" icon={<IconEye />} onClick={() => handleEditTemplate(record)}>
            查看
          </Button>
          {record.status === 'DRAFT' && (
            <Button size="small" icon={<IconEdit />} onClick={() => handleEditTemplate(record)}>
              编辑
            </Button>
          )}
          <Button
            size="small"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDeleteTemplate(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const instanceColumns = [
    { title: '模板', dataIndex: 'templateName', width: 150 },
    { title: '标题', dataIndex: 'subject', width: 200 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: StatusKey) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    { title: '申请人', dataIndex: 'applicantName', width: 100 },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: WorkflowInstance) => (
        <Space size={8}>
          <Button size="small" icon={<IconEye />}>
            详情
          </Button>
          {record.status === 'IN_PROGRESS' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<IconCheck />}
                onClick={() => handleApprove(record)}
              >
                通过
              </Button>
              <Button
                size="small"
                status="danger"
                icon={<IconClose />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
              <Button size="small" icon={<IconRefresh />} onClick={() => handleReturn(record)}>
                退回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const myTasks = instances.filter((i) => i.status === 'IN_PROGRESS');

  return (
    <div className={styles.page}>
      <PageHeader
        title="审批管理"
        breadcrumb={{
          routes: [
            { path: '/', breadcrumbName: '首页' },
            { path: '/approval', breadcrumbName: '工作流' },
            { path: '/approval', breadcrumbName: '审批管理' },
          ],
        }}
      />
      <Card className={styles.card}>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane key="templates" title="审批模板">
            <div className={styles.toolbar}>
              <Space size={16}>
                <Button type="primary" icon={<IconPlus />} onClick={handleCreateTemplate}>
                  新建模板
                </Button>
              </Space>
            </div>
            <BaseTable
              columns={templateColumns}
              data={templates}
              loading={templatesLoading}
              pagination={{
                page: templatesPage,
                pageSize: 10,
                total: templates.length,
                onChange: (page) => setTemplatesPage(page),
              }}
              rowKey="id"
              showIndexColumn
              actions={null}
            />
          </Tabs.TabPane>

          <Tabs.TabPane key="instances" title="审批实例">
            <div className={styles.toolbar}>
              <Space size={16}>
                <Button type="primary" icon={<IconPlayCircle />}>
                  发起审批
                </Button>
              </Space>
            </div>
            <BaseTable
              columns={instanceColumns}
              data={instances}
              loading={instancesLoading}
              pagination={{
                page: instancesPage,
                pageSize: 10,
                total: instances.length,
                onChange: (page) => setInstancesPage(page),
              }}
              rowKey="id"
              showIndexColumn
              actions={null}
            />
          </Tabs.TabPane>

          <Tabs.TabPane key="my-tasks" title="我的审批">
            <BaseTable
              columns={instanceColumns}
              data={myTasks}
              loading={instancesLoading}
              pagination={{
                page: pendingPage,
                pageSize: 10,
                total: myTasks.length,
                onChange: (page) => setPendingPage(page),
              }}
              rowKey="id"
              showIndexColumn
              actions={null}
            />
          </Tabs.TabPane>
        </Tabs>

        {showEditor && (
          <TemplateEditor
            template={editingTemplate}
            onClose={() => {
              setShowEditor(false);
              setEditingTemplate(null);
              refetchTemplates();
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default Approval;
