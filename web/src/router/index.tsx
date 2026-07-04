import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spin } from '@arco-design/web-react';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import { PermissionGuard } from '@/components/PermissionGuard';
import styles from './style.module.css';

const Dashboard = lazy(() => import('@/features/dashboard'));
const Organization = lazy(() => import('@/features/organization'));
const Employee = lazy(() => import('@/features/employee'));
const Schedule = lazy(() => import('@/features/schedule'));
const Attendance = lazy(() => import('@/features/attendance'));
const Leave = lazy(() => import('@/features/leave'));
const Salary = lazy(() => import('@/features/salary'));
const Expense = lazy(() => import('@/features/expense'));
const Training = lazy(() => import('@/features/training'));
const Knowledge = lazy(() => import('@/features/knowledge'));
const Approval = lazy(() => import('@/features/approval'));
const Message = lazy(() => import('@/features/message'));
const Audit = lazy(() => import('@/features/audit'));
const Profile = lazy(() => import('@/features/profile'));
const System = lazy(() => import('@/features/system'));
const Report = lazy(() => import('@/features/report'));

function PageLoading() {
  return (
    <div className={styles.pageLoading}>
      <Spin />
    </div>
  );
}

function withSuspense(Component: ComponentType) {
  return function SuspenseWrapper() {
    return (
      <Suspense fallback={<PageLoading />}>
        <Component />
      </Suspense>
    );
  };
}

const DashboardPage = withSuspense(Dashboard);
const OrganizationPage = withSuspense(Organization);
const EmployeePage = withSuspense(Employee);
const SchedulePage = withSuspense(Schedule);
const AttendancePage = withSuspense(Attendance);
const LeavePage = withSuspense(Leave);
const SalaryPage = withSuspense(Salary);
const ExpensePage = withSuspense(Expense);
const TrainingPage = withSuspense(Training);
const KnowledgePage = withSuspense(Knowledge);
const ApprovalPage = withSuspense(Approval);
const MessagePage = withSuspense(Message);
const AuditPage = withSuspense(Audit);
const ProfilePage = withSuspense(Profile);
const SystemPage = withSuspense(System);
const ReportPage = withSuspense(Report);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<PermissionGuard permission="dashboard:view"><DashboardPage /></PermissionGuard>} />
        <Route path="organization" element={<PermissionGuard permission="department:read"><OrganizationPage /></PermissionGuard>} />
        <Route path="employee" element={<PermissionGuard permission="employee:read"><EmployeePage /></PermissionGuard>} />
        <Route path="schedule" element={<PermissionGuard permission="schedule:read"><SchedulePage /></PermissionGuard>} />
        <Route path="attendance" element={<PermissionGuard permission="attendance:read"><AttendancePage /></PermissionGuard>} />
        <Route path="leave" element={<PermissionGuard permission="leave:read"><LeavePage /></PermissionGuard>} />
        <Route path="salary" element={<PermissionGuard permission="salary:view"><SalaryPage /></PermissionGuard>} />
        <Route path="expense" element={<PermissionGuard permission="expense:read"><ExpensePage /></PermissionGuard>} />
        <Route path="training" element={<PermissionGuard permission="training:read"><TrainingPage /></PermissionGuard>} />
        <Route path="knowledge" element={<PermissionGuard permission="kb:read"><KnowledgePage /></PermissionGuard>} />
        <Route path="approval" element={<PermissionGuard permission="workflow:instance:read"><ApprovalPage /></PermissionGuard>} />
        <Route path="message" element={<PermissionGuard permission="message:read"><MessagePage /></PermissionGuard>} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="system" element={<PermissionGuard permission="user:read"><SystemPage /></PermissionGuard>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
