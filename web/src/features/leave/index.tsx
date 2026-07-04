/*
 * 修改点：
 * 1. 新增 PageHeader（标题+面包屑，breadcrumb 对象格式）
 * 2. STATUS_MAP 硬编码色值 → arco Tag 预设色名（orang/green/red/gray）
 * 3. 内联 style={{ marginBottom: 16 }} → CSS module filterCard 类名
 * 4. 内联 style={{ width: 120 }} → CSS module yearSelect 类名
 * 5. values: any → LeaveRequestCreate 具体类型
 * 6. LeaveRequest → LeaveRequestListItem
 * 7. 页面间距改用 CSS module，pagePadding 24px
 * 8. 按钮文案统一动词+名词格式
 * 9. fixed: 'right' → 'right' as const
 * 10. render 第一个参数 _ → _col: unknown
 * 11. 移除 LeaveRequestForm 的 form prop（BaseFormModal 内部管理）
 * 12. STATUS_MAP key 类型从 string 收紧为 LeaveRequestStatus
 */
import {
  Card,
  Tabs,
  Button,
  Modal,
  Message,
  Tag,
  Space,
  Select,
  PageHeader,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconCheck,
  IconClose,
  IconEdit,
} from '@arco-design/web-react/icon';
import { useState, useRef } from 'react';
import BaseTable from '@/components/BaseTable';
import BaseFormModal from '@/components/BaseFormModal';
import type { BaseFormModalRef } from '@/components/BaseFormModal';
import LeaveRequestForm from './components/LeaveRequestForm';
import {
  useLeaveQuotaList,
  useInitLeaveQuota,
  useLeaveRequestList,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useCancelLeaveRequest,
} from './hooks/useLeave';
import type {
  LeaveQuota,
  LeaveRequestListItem,
  LeaveRequestStatus,
  LeaveType,
  LeaveTimeHalf,
  LeaveRequestCreate,
} from '@shop/shared';
import styles from './index.module.css';

const LEAVE_TYPE_MAP: Record<LeaveType, string> = {
  ANNUAL: '年假',
  SICK: '病假',
  PERSONAL: '事假',
  COMPENSATORY: '调休',
  MARRIAGE: '婚假',
  MATERNITY: '产假',
};

const LEAVE_TIME_HALF_MAP: Record<LeaveTimeHalf, string> = {
  AM: '上午',
  PM: '下午',
  ALL: '全天',
};

const STATUS_MAP: Record<LeaveRequestStatus, { label: string; color: string }> = {
  PENDING: { label: '待审批', color: 'orange' },
  APPROVED: { label: '已批准', color: 'green' },
  REJECTED: { label: '已拒绝', color: 'red' },
  CANCELLED: { label: '已取消', color: 'gray' },
};

function Leave() {
  const [activeTab, setActiveTab] = useState('quota');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [quotaPage, setQuotaPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const formModalRef = useRef<BaseFormModalRef>(null);

  const quotaParams = {
    page: quotaPage,
    pageSize: 10,
    year: selectedYear,
  };

  const requestParams = {
    page: requestPage,
    pageSize: 10,
  };

  const { data: quotaData, isLoading: quotaLoading } = useLeaveQuotaList(quotaParams);
  const { data: requestData, isLoading: requestLoading } = useLeaveRequestList(requestParams);
  const initMutation = useInitLeaveQuota();
  const createMutation = useCreateLeaveRequest();
  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();

  const handleInitQuota = () => {
    Modal.confirm({
      title: '初始化假期额度',
      content: `确定要为所有在职员工初始化 ${selectedYear} 年度假期额度吗？`,
      onOk: async () => {
        try {
          await initMutation.mutateAsync({ year: selectedYear });
          Message.success('初始化成功');
        } catch {
          Message.error('初始化失败');
        }
      },
    });
  };

  const handleAddRequest = () => {
    setModalVisible(true);
  };

  const handleSubmitRequest = async (values: Record<string, unknown>) => {
    try {
      await createMutation.mutateAsync(values as LeaveRequestCreate);
      Message.success('创建成功');
      setModalVisible(false);
    } catch {
      // error handled by request interceptor
    }
  };

  const handleApprove = (record: LeaveRequestListItem) => {
    Modal.confirm({
      title: '审批通过',
      content: `确定要批准 ${record.employeeId} 的请假申请吗？`,
      onOk: async () => {
        try {
          await approveMutation.mutateAsync({ id: record.id, data: {} });
          Message.success('审批通过');
        } catch {
          Message.error('审批失败');
        }
      },
    });
  };

  const handleReject = (record: LeaveRequestListItem) => {
    Modal.confirm({
      title: '拒绝申请',
      content: `确定要拒绝 ${record.employeeId} 的请假申请吗？`,
      onOk: async () => {
        try {
          await rejectMutation.mutateAsync({ id: record.id, data: { reason: '工作需要' } });
          Message.success('已拒绝');
        } catch {
          Message.error('操作失败');
        }
      },
    });
  };

  const handleCancel = (record: LeaveRequestListItem) => {
    Modal.confirm({
      title: '取消申请',
      content: `确定要取消 ${record.employeeId} 的请假申请吗？`,
      onOk: async () => {
        try {
          await cancelMutation.mutateAsync(record.id);
          Message.success('已取消');
        } catch {
          Message.error('操作失败');
        }
      },
    });
  };

  const quotaColumns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      width: 120,
    },
    {
      title: '年度',
      dataIndex: 'year',
      width: 80,
    },
    {
      title: '年假余额(天)',
      dataIndex: 'annualBalance',
      width: 120,
      render: (_col: unknown, record: LeaveQuota) => (
        <span>{Number(record.annualBalance)}</span>
      ),
    },
    {
      title: '年假已用(天)',
      dataIndex: 'annualUsed',
      width: 120,
      render: (_col: unknown, record: LeaveQuota) => (
        <span>{Number(record.annualUsed)}</span>
      ),
    },
    {
      title: '病假已用(天)',
      dataIndex: 'sickUsed',
      width: 120,
      render: (_col: unknown, record: LeaveQuota) => (
        <span>{Number(record.sickUsed)}</span>
      ),
    },
    {
      title: '事假已用(天)',
      dataIndex: 'personalUsed',
      width: 120,
      render: (_col: unknown, record: LeaveQuota) => (
        <span>{Number(record.personalUsed)}</span>
      ),
    },
    {
      title: '调休余额(天)',
      dataIndex: 'compensatoryBalance',
      width: 120,
      render: (_col: unknown, record: LeaveQuota) => (
        <span>{Number(record.compensatoryBalance)}</span>
      ),
    },
  ];

  const requestColumns = [
    {
      title: '员工',
      dataIndex: 'employeeId',
      width: 100,
    },
    {
      title: '请假类型',
      dataIndex: 'type',
      width: 100,
      render: (_col: unknown, record: LeaveRequestListItem) => (
        <Tag>{LEAVE_TYPE_MAP[record.type]}</Tag>
      ),
    },
    {
      title: '请假时间',
      width: 200,
      render: (_col: unknown, record: LeaveRequestListItem) => (
        <span>
          {record.startDate} {LEAVE_TIME_HALF_MAP[record.startTime]} 
          {record.startDate !== record.endDate && ` - ${record.endDate} ${LEAVE_TIME_HALF_MAP[record.endTime]}`}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_col: unknown, record: LeaveRequestListItem) => (
        <Tag color={STATUS_MAP[record.status].color}>
          {STATUS_MAP[record.status].label}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_col: unknown, record: LeaveRequestListItem) => (
        <Space size={8}>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="text"
                icon={<IconCheck />}
                onClick={() => handleApprove(record)}
              >
                批准申请
              </Button>
              <Button
                type="text"
                status="danger"
                icon={<IconClose />}
                onClick={() => handleReject(record)}
              >
                拒绝申请
              </Button>
              <Button
                type="text"
                icon={<IconEdit />}
                onClick={() => handleCancel(record)}
              >
                取消申请
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="假期管理"
        breadcrumb={{
          routes: [
            { path: '/', breadcrumbName: '首页' },
            { path: '/leave', breadcrumbName: '假期' },
            { path: '/leave', breadcrumbName: '假期管理' },
          ],
        }}
      />
      <div className={styles.pageContent}>
        <Card>
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane key="quota" title="假期额度">
              <Card
                className={styles.filterCard}
                extra={
                  <Space>
                    <Select
                      value={selectedYear}
                      onChange={(value) => setSelectedYear(value)}
                      className={styles.yearSelect}
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <Select.Option key={year} value={year}>
                            {year}年
                          </Select.Option>
                        );
                      })}
                    </Select>
                    <Button type="primary" onClick={handleInitQuota} loading={initMutation.isPending}>
                      初始化额度
                    </Button>
                  </Space>
                }
              />
              <BaseTable
                columns={quotaColumns}
                data={quotaData?.list || []}
                pagination={{
                  page: quotaParams.page,
                  pageSize: quotaParams.pageSize,
                  total: quotaData?.total || 0,
                  onChange: (page) => setQuotaPage(page),
                }}
                loading={quotaLoading}
                showIndexColumn
                actions={null}
              />
            </Tabs.TabPane>
            <Tabs.TabPane key="request" title="请假申请">
              <Card
                className={styles.filterCard}
                extra={
                  <Button type="primary" icon={<IconPlus />} onClick={handleAddRequest}>
                    新增申请
                  </Button>
                }
              />
              <BaseTable
                columns={requestColumns}
                data={requestData?.list || []}
                pagination={{
                  page: requestParams.page,
                  pageSize: requestParams.pageSize,
                  total: requestData?.total || 0,
                  onChange: (page) => setRequestPage(page),
                }}
                loading={requestLoading}
                showIndexColumn
                actions={null}
              />
            </Tabs.TabPane>
          </Tabs>

          <BaseFormModal
            ref={formModalRef}
            visible={modalVisible}
            title="新增请假申请"
            onOk={handleSubmitRequest}
            onCancel={() => setModalVisible(false)}
            loading={createMutation.isPending}
            okText="确认"
            cancelText="取消"
            width={600}
          >
            <LeaveRequestForm />
          </BaseFormModal>
        </Card>
      </div>
    </div>
  );
}

export default Leave;
