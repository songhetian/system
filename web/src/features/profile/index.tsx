import { useState } from 'react';
import { PageHeader, Card, Descriptions, Form, Input, Button, Message, Divider } from '@arco-design/web-react';
import { useAuthStore } from '@/store/auth';
import request from '@/api/request';
import styles from './index.module.css';

function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [changingPwd, setChangingPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await request.post('/auth/change-password', values);
      Message.success('密码修改成功，请重新登录');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } catch {
      Message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader title="个人中心" breadcrumb={{ routes: [{ path: '/', breadcrumbName: '首页' }, { path: '/个人中心', breadcrumbName: '个人中心' }] }} />
      <Card title="基本信息" style={{ maxWidth: 600, marginBottom: 16 }}>
        <Descriptions
          data={[
            { label: '用户名', value: user?.username || '--' },
            { label: '角色', value: (user as any)?.role || '管理员' },
            { label: '邮箱', value: (user as any)?.email || '--' },
            { label: '创建时间', value: (user as any)?.createdAt?.split('T')[0] || '--' },
          ]}
          column={1}
          labelStyle={{ width: 80, fontWeight: 500 }}
        />
      </Card>

      <Card title="修改密码" style={{ maxWidth: 600 }}>
        {!changingPwd ? (
          <Button type="primary" onClick={() => setChangingPwd(true)}>修改密码</Button>
        ) : (
          <Form layout="vertical" onSubmit={handleChangePassword} style={{ maxWidth: 320 }}>
            <Form.Item label="旧密码" field="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
              <Input.Password placeholder="请输入旧密码" />
            </Form.Item>
            <Form.Item label="新密码" field="newPassword" rules={[{ required: true, minLength: 6, message: '至少6位' }]}>
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 12 }}>确认修改</Button>
              <Button onClick={() => setChangingPwd(false)}>取消</Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}

export default ProfilePage;
