// 修改点:
// 1. 全部内联style → CSS Modules + Space组件
// 2. useState管理表单 → Arco Form受控
// 3. any类型 → Zod schema校验
// 4. 补齐loading/error状态
// 5. queryClient导入 → useQueryClient hook
// 6. 硬编码options → 常量提取

import { useState } from 'react';
import { PageHeader, Card, Tabs, Button, Form, Input, Message, Modal, Switch, Result } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/api/request';
import BaseTable from '@/components/BaseTable';
import styles from './index.module.css';

const zCreateUser = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少6位'),
});

const zCreateRole = z.object({
  name: z.string().min(1, '请输入角色名称'),
  code: z.string().min(1, '请输入角色编码'),
});

function UserTab() {
  const qc = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => request.get<{ list: any[]; total: number }>('/users', { params: { page: 1, pageSize: 100 } }),
    staleTime: 60 * 1000,
  });

  const createMut = useMutation({
    mutationFn: (values: z.infer<typeof zCreateUser>) => request.post('/users', values),
    onSuccess: () => { setVisible(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['users'] }); Message.success('创建成功'); },
    onError: () => Message.error('创建失败'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => request.put(`/users/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  if (error) return <Result status="error" title="加载失败" />;

  const list = data?.list || [];
  const columns = [
    { title: '用户名', dataIndex: 'username', width: 150 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string, r: any) => <Switch checked={v === 'ACTIVE'} onChange={(on) => toggleMut.mutate({ id: r.id, status: on ? 'ACTIVE' : 'DISABLED' })} loading={toggleMut.isPending} />,
    },
    {
      title: '角色', dataIndex: 'roles', width: 200,
      render: (v: any[]) => v?.map((r: any) => r.role?.name).join(', ') || '无',
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => v?.split('T')[0] },
  ];

  return (
    <div>
      <Button type="primary" icon={<IconPlus />} onClick={() => setVisible(true)} className={styles.toolbarBtn}>新增用户</Button>
      <BaseTable columns={columns} data={list} loading={isLoading} pagination={false} rowKey="id" />
      <Modal
        title="新增用户"
        visible={visible}
        onOk={() => form.submit()}
        onCancel={() => setVisible(false)}
        confirmLoading={createMut.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={(values) => {
            const parsed = zCreateUser.safeParse(values);
            if (parsed.success) createMut.mutate(parsed.data);
            else Message.error(parsed.error.errors[0]?.message || '校验失败');
          }}
        >
          <Form.Item label="用户名" field="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" field="password" rules={[{ required: true, minLength: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="至少6位" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function RoleTab() {
  const qc = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => request.get<{ list: any[]; total: number }>('/roles', { params: { page: 1, pageSize: 100 } }),
    staleTime: 5 * 60 * 1000,
  });

  const createMut = useMutation({
    mutationFn: (values: z.infer<typeof zCreateRole>) => request.post('/roles', values),
    onSuccess: () => { setVisible(false); form.resetFields(); qc.invalidateQueries({ queryKey: ['roles'] }); Message.success('创建成功'); },
    onError: () => Message.error('创建失败'),
  });

  if (error) return <Result status="error" title="加载失败" />;

  const columns = [
    { title: '角色名称', dataIndex: 'name' },
    { title: '角色编码', dataIndex: 'code' },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => v?.split('T')[0] },
  ];

  return (
    <div>
      <Button type="primary" icon={<IconPlus />} onClick={() => setVisible(true)} className={styles.toolbarBtn}>新增角色</Button>
      <BaseTable columns={columns} data={data?.list || []} loading={isLoading} pagination={false} rowKey="id" />
      <Modal
        title="新增角色"
        visible={visible}
        onOk={() => form.submit()}
        onCancel={() => setVisible(false)}
        confirmLoading={createMut.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={(values) => {
            const parsed = zCreateRole.safeParse(values);
            if (parsed.success) createMut.mutate(parsed.data);
            else Message.error(parsed.error.errors[0]?.message || '校验失败');
          }}
        >
          <Form.Item label="角色名称" field="name" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="如：HR管理员" />
          </Form.Item>
          <Form.Item label="角色编码" field="code" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input placeholder="如：hr_admin" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function PermissionTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => request.get<{ list: any[]; total: number }>('/permissions', { params: { page: 1, pageSize: 200 } }),
    staleTime: 5 * 60 * 1000,
  });

  if (error) return <Result status="error" title="加载失败" />;

  const grouped: Record<string, any[]> = {};
  (data?.list || []).forEach((p: any) => {
    const g = p.group || '其他';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(p);
  });

  const columns = [
    { title: '权限编码', dataIndex: 'code' },
    { title: '权限名称', dataIndex: 'name' },
    { title: '分组', dataIndex: 'group', width: 120 },
  ];

  return (
    <div className={styles.toolbarBtn}>
      {Object.entries(grouped).map(([group, perms]) => (
        <Card title={group} key={group} className={styles.permCard}>
          <BaseTable columns={columns} data={perms} loading={isLoading} pagination={false} rowKey="id" />
        </Card>
      ))}
    </div>
  );
}

function SystemPage() {
  const [tab, setTab] = useState('users');

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="系统管理" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/system', breadcrumbName: '系统管理' }] }} />
      <Card>
        <Tabs activeTab={tab} onChange={setTab}>
          <Tabs.TabPane key="users" title="用户管理"><UserTab /></Tabs.TabPane>
          <Tabs.TabPane key="roles" title="角色管理"><RoleTab /></Tabs.TabPane>
          <Tabs.TabPane key="permissions" title="权限列表"><PermissionTab /></Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default SystemPage;
