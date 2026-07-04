import { useEffect, useRef } from 'react';
import { Card, Statistic, Grid, Space, PageHeader } from '@arco-design/web-react';
import {
  IconUser,
  IconCalendar,
  IconClockCircle,
  IconNotification,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'chart.js/auto';
import styles from './style.module.css';

import { useQuery } from '@tanstack/react-query';
import request from '@/api/request';

const { Row, Col } = Grid;

const quickLinks = [
  { label: '组织架构', path: '/organization' },
  { label: '员工管理', path: '/employee' },
  { label: '排班管理', path: '/schedule' },
  { label: '考勤管理', path: '/attendance' },
  { label: '假期管理', path: '/leave' },
  { label: '薪资管理', path: '/salary' },
  { label: '审批管理', path: '/approval' },
  { label: '培训管理', path: '/training' },
  { label: '知识库', path: '/knowledge' },
];

// Arco 色板 hex 对应 token: primary/success/warning/danger-6
const C_PRI = '#1677ff';
const C_SUC = '#0fbe6d';
const C_WAR = '#ff7d00';
const C_DAN = '#f53f3f';
const C_CHART = ['#1677ff','#0fbe6d','#ff7d00','#f53f3f','#4e5969'];

function DepartmentChart({ data }: { data: { name: string; count: number }[] | undefined }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data?.length) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: C_CHART.slice(0, data.length),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { padding: 16, font: { size: 12 } } } },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [data]);

  return <div className={styles.chartDoughnut}><canvas ref={ref} role="img" aria-label="部门人数分布饼图" /></div>;
}

function AttendanceTrendChart({ data }: { data: { date: string; onTime: number; late: number; absent: number }[] | undefined }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data?.length) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          { label: '正常', data: data.map(d => d.onTime), borderColor: C_SUC, backgroundColor: 'rgba(15,190,109,0.1)', fill: true, tension: 0.3, pointRadius: 2 },
          { label: '迟到', data: data.map(d => d.late), borderColor: C_WAR, backgroundColor: 'rgba(255,125,0,0.1)', fill: true, tension: 0.3, pointRadius: 2 },
          { label: '缺勤', data: data.map(d => d.absent), borderColor: C_DAN, backgroundColor: 'rgba(245,63,63,0.1)', fill: true, tension: 0.3, pointRadius: 2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { padding: 16, font: { size: 12 }, usePointStyle: true } } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 15 } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [data]);

  return <div className={styles.chartLine}><canvas ref={ref} role="img" aria-label="本月考勤趋势图" /></div>;
}

function SummaryChart({ data }: { data: { labels: string[]; values: number[] } | undefined }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: '本月统计',
          data: data.values,
          backgroundColor: [C_PRI, C_SUC, C_WAR, '#165df4'],
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [data]);

  return <div className={styles.chartBar}><canvas ref={ref} role="img" aria-label="本月请假加班统计图" /></div>;
}

function Dashboard() {
  const navigate = useNavigate();

  const { data: empData } = useQuery({
    queryKey: ['dashboard', 'employee-count'],
    queryFn: () => request.get<{ total: number }>('/employees', { params: { page: 1, pageSize: 1 } }),
    staleTime: 5 * 60 * 1000,
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: scheduleData } = useQuery({
    queryKey: ['dashboard', 'today-schedule', today],
    queryFn: async () => {
      const schedules = await request.get<any[]>('/schedule/schedules', { params: { startDate: today, endDate: today, page: 1, pageSize: 100 } });
      return { count: Array.isArray(schedules) ? schedules.length : 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const { data: attendanceData } = useQuery({
    queryKey: ['dashboard', 'attendance-rate', year, month],
    queryFn: async () => {
      const res = await request.get<{ list: { actualWorkDays: number; shouldWorkDays: number }[] }>('/attendance/attendance-summaries', { params: { year, month, page: 1, pageSize: 100 } });
      const summaries = res.list || [];
      if (summaries.length === 0) return { rate: '--' };
      const totalActual = summaries.reduce((s, r) => s + Number(r.actualWorkDays), 0);
      const totalShould = summaries.reduce((s, r) => s + Number(r.shouldWorkDays), 0);
      return { rate: totalShould > 0 ? `${((totalActual / totalShould) * 100).toFixed(1)}%` : '--' };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingData } = useQuery({
    queryKey: ['dashboard', 'pending-count'],
    queryFn: async () => {
      const res = await request.get<{ total: number }>('/workflow/instances', { params: { status: 'IN_PROGRESS', page: 1, pageSize: 1 } });
      return res.total || 0;
    },
    staleTime: 60 * 1000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => request.get<{ departmentChart: { name: string; count: number }[]; attendanceTrend: any[]; summaryChart: { labels: string[]; values: number[] } }>('/dashboard-stats'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: annData } = useQuery({
    queryKey: ['dashboard', 'announcements'],
    queryFn: () => request.get<{ list: { title: string; publishedAt: string }[] }>('/announcements', { params: { status: 'PUBLISHED', page: 1, pageSize: 5 } }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className={styles.container}>
      <PageHeader
        title="仪表盘"
        breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/dashboard', breadcrumbName: '仪表盘' }] }}
        className={styles.pageHeader}
      />
      <Row gutter={16}>
        <Col span={6}>
          <Card><Statistic title="员工总数" value={empData?.total || 0} prefix={<IconUser />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="今日排班" value={scheduleData?.count || 0} prefix={<IconCalendar />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="本月出勤" value={attendanceData?.rate || '--'} prefix={<IconClockCircle />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待审批" value={pendingData || 0} prefix={<IconNotification />} /></Card>
        </Col>
      </Row>
      <div className={styles.chartSection}>
        <Row gutter={16}>
          <Col span={12}>
            <Card title="部门人数分布">
              <DepartmentChart data={chartData?.departmentChart} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="本月统计">
              <SummaryChart data={chartData?.summaryChart} />
            </Card>
          </Col>
        </Row>
        <div className={styles.chartTrend}>
          <Card title="本月考勤趋势">
            <AttendanceTrendChart data={chartData?.attendanceTrend} />
          </Card>
        </div>
        <div className={styles.bottomSection}>
          <Card title="快捷入口">
            <Space size={16} wrap>
              {quickLinks.map(link => (
                <span key={link.path} className={styles.quickLink} onClick={() => navigate(link.path)}>
                  {link.label}
                </span>
              ))}
            </Space>
          </Card>
          <Card title="系统公告">
            {annData?.list?.length ? annData.list.map((a, i: number) => (
              <p key={i} className={styles.announcement}>{a.title}</p>
            )) : <p className={styles.dimText}>暂无公告</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
