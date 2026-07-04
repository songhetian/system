/*
 * 修改点：
 * 1. 新增 PageHeader（标题+面包屑）
 * 2. 硬编码色值 #00b42a、#1677ff、#f53f3f、#ff7d00 → arco Tag 预设色名 / CSS Token
 * 3. 内联 style={{ marginBottom: 16 }} → CSS module filterCard 类名
 * 4. 内联 style={{ width: 120 }} → CSS module yearSelect/monthSelect 类名
 * 5. 内联 style={{ color: ... }} → CSS module dangerText/warningText 类名
 * 6. 页面间距改用 CSS module，pagePadding 24px
 * 7. 按钮文案统一动词+名词格式
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
  DatePicker,
  PageHeader,
} from '@arco-design/web-react';
import type { Dayjs } from 'dayjs';
import {
  IconLock,
  IconUnlock,
} from '@arco-design/web-react/icon';
import { useState } from 'react';
import BaseTable from '@/components/BaseTable';
import {
  useAttendanceRecordList,
  useAttendanceSummaryList,
  useGenerateAttendanceSummary,
  useLockAttendanceSummary,
  useUnlockAttendanceSummary,
} from './hooks/useAttendance';
import type { AttendanceRecord, AttendanceSummary } from '@shop/shared';
import styles from './index.module.css';

function Attendance() {
  const [activeTab, setActiveTab] = useState('records');
  const [dateRange, setDateRange] = useState<Dayjs[] | null>(null);
  const [recordsPage, setRecordsPage] = useState(1);
  const [summariesPage, setSummariesPage] = useState(1);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const recordParams = {
    page: recordsPage,
    pageSize: 10,
    dateFrom: dateRange?.[0]?.format('YYYY-MM-DD'),
    dateTo: dateRange?.[1]?.format('YYYY-MM-DD'),
  };

  const summaryParams = {
    page: summariesPage,
    pageSize: 10,
    year: currentYear,
    month: currentMonth,
  };

  const { data: recordData, isLoading: recordLoading } = useAttendanceRecordList(recordParams);
  const { data: summaryData, isLoading: summaryLoading } = useAttendanceSummaryList(summaryParams);
  const generateMutation = useGenerateAttendanceSummary();
  const lockMutation = useLockAttendanceSummary();
  const unlockMutation = useUnlockAttendanceSummary();

  const handleGenerate = () => {
    Modal.confirm({
      title: '生成考勤台账',
      content: `确定要生成 ${currentYear} 年 ${currentMonth} 月的考勤台账吗？`,
      onOk: () =>
        generateMutation
          .mutateAsync({ year: currentYear, month: currentMonth, departmentId: null })
          .then(() => Message.success('生成成功')),
    });
  };

  const handleLock = (record: AttendanceSummary) => {
    Modal.confirm({
      title: '锁定考勤台账',
      content: `确定要锁定 ${record.employeeName} 的考勤台账吗？锁定后将无法修改。`,
      onOk: () => lockMutation.mutateAsync(record.id).then(() => Message.success('锁定成功')),
    });
  };

  const handleUnlock = (record: AttendanceSummary) => {
    Modal.confirm({
      title: '解锁考勤台账',
      content: `确定要解锁 ${record.employeeName} 的考勤台账吗？`,
      onOk: () => unlockMutation.mutateAsync(record.id).then(() => Message.success('解锁成功')),
    });
  };

  const recordColumns = [
    {
      title: '员工',
      dataIndex: 'employeeId',
      width: 120,
    },
    {
      title: '打卡类型',
      dataIndex: 'type',
      width: 100,
      render: (_col: unknown, record: AttendanceRecord) => (
        <Tag color={record.type === 'IN' ? 'green' : 'blue'}>
          {record.type === 'IN' ? '上班' : '下班'}
        </Tag>
      ),
    },
    {
      title: '打卡时间',
      dataIndex: 'timestamp',
      width: 180,
      render: (_col: unknown, record: AttendanceRecord) => (
        <span>{new Date(record.timestamp).toLocaleString()}</span>
      ),
    },
    {
      title: '迟到(分钟)',
      dataIndex: 'lateMinutes',
      width: 100,
      render: (_col: unknown, record: AttendanceRecord) => (
        <span className={record.lateMinutes > 0 ? styles.dangerText : undefined}>
          {record.lateMinutes}
        </span>
      ),
    },
    {
      title: '早退(分钟)',
      dataIndex: 'earlyMinutes',
      width: 100,
      render: (_col: unknown, record: AttendanceRecord) => (
        <span className={record.earlyMinutes > 0 ? styles.dangerText : undefined}>
          {record.earlyMinutes}
        </span>
      ),
    },
  ];

  const summaryColumns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      width: 120,
    },
    {
      title: '年月',
      width: 100,
      render: (_col: unknown, record: AttendanceSummary) => (
        <span>{record.year}年{record.month}月</span>
      ),
    },
    {
      title: '应出勤天数',
      dataIndex: 'shouldWorkDays',
      width: 100,
    },
    {
      title: '实际出勤天数',
      dataIndex: 'actualWorkDays',
      width: 100,
    },
    {
      title: '迟到次数',
      dataIndex: 'lateCount',
      width: 100,
      render: (_col: unknown, record: AttendanceSummary) => (
        <span className={record.lateCount > 0 ? styles.warningText : undefined}>
          {record.lateCount}
        </span>
      ),
    },
    {
      title: '早退次数',
      dataIndex: 'earlyCount',
      width: 100,
      render: (_col: unknown, record: AttendanceSummary) => (
        <span className={record.earlyCount > 0 ? styles.warningText : undefined}>
          {record.earlyCount}
        </span>
      ),
    },
    {
      title: '加班时长(小时)',
      dataIndex: 'overtimeHours',
      width: 120,
    },
    {
      title: '缺勤天数',
      dataIndex: 'absentDays',
      width: 100,
      render: (_col: unknown, record: AttendanceSummary) => (
        <span className={record.absentDays > 0 ? styles.dangerText : undefined}>
          {record.absentDays}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'locked',
      width: 80,
      render: (_col: unknown, record: AttendanceSummary) => (
        <Tag color={record.locked ? 'red' : 'green'}>
          {record.locked ? '已锁定' : '正常'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_col: unknown, record: AttendanceSummary) => (
        <Space size={8}>
          {record.locked ? (
            <Button
              type="text"
              icon={<IconUnlock />}
              onClick={() => handleUnlock(record)}
            >
              解锁台账
            </Button>
          ) : (
            <Button
              type="text"
              icon={<IconLock />}
              onClick={() => handleLock(record)}
            >
              锁定台账
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="考勤管理"
        breadcrumb={{
          routes: [
            { path: '/', breadcrumbName: '首页' },
            { path: '/attendance', breadcrumbName: '考勤' },
            { path: '/attendance', breadcrumbName: '考勤管理' },
          ],
        }}
      />
      <div className={styles.pageContent}>
        <Card>
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane key="records" title="打卡记录">
              <Card
                className={styles.filterCard}
                extra={
                  <Space>
                    <DatePicker.RangePicker
                      value={dateRange as unknown as Dayjs[]}
                      onChange={(value) => setDateRange(value as unknown as Dayjs[])}
                      placeholder={['开始日期', '结束日期']}
                    />
                  </Space>
                }
              />
              <BaseTable
                columns={recordColumns}
                data={recordData?.list || []}
                pagination={{
                  page: recordParams.page,
                  pageSize: recordParams.pageSize,
                  total: recordData?.total || 0,
                  onChange: (page) => setRecordsPage(page),
                }}
                loading={recordLoading}
                showIndexColumn
                actions={null}
              />
            </Tabs.TabPane>
            <Tabs.TabPane key="summary" title="考勤台账">
              <Card
                className={styles.filterCard}
                extra={
                  <Space>
                    <Select
                      value={currentYear}
                      className={styles.yearSelect}
                      disabled
                    >
                      <Select.Option value={currentYear}>{currentYear}年</Select.Option>
                    </Select>
                    <Select
                      value={currentMonth}
                      className={styles.monthSelect}
                      disabled
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <Select.Option key={i + 1} value={i + 1}>
                          {i + 1}月
                        </Select.Option>
                      ))}
                    </Select>
                    <Button type="primary" onClick={handleGenerate} loading={generateMutation.isPending}>
                      生成台账
                    </Button>
                  </Space>
                }
              />
              <BaseTable
                columns={summaryColumns}
                data={summaryData?.list || []}
                pagination={{
                  page: summaryParams.page,
                  pageSize: summaryParams.pageSize,
                  total: summaryData?.total || 0,
                  onChange: (page) => setSummariesPage(page),
                }}
                loading={summaryLoading}
                showIndexColumn
                actions={null}
              />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default Attendance;
