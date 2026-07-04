/*
 * 修改点：
 * 1. 移除 Rule 类型导入（Arco Form 没有导出 Rule 类型）
 * 2. 修复 validator 参数类型
 * 3. 修复 Form.useForm 泛型参数
 * 4. 修复 request.post 泛型参数
 * 5. 修复 data.accessToken / data.user 类型
 */
import { Form, Input, Button, Card, Typography } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import request from '@/api/request';
import { useAuthStore } from '@/store/auth';
import { z } from 'zod';
import { zLoginInput, type LoginInput, type LoginOutput, type User } from '@shop/shared';
import styles from './Login.module.css';

const FormItem = Form.Item;
const Title = Typography.Title;

function generateZodRules<T extends Record<string, unknown>>(
  schema: z.ZodObject<z.ZodRawShape>
): Record<keyof T, { validator: (value: unknown, cb: (error?: string) => void) => void }[]> {
  const rules: Record<string, { validator: (value: unknown, cb: (error?: string) => void) => void }[]> = {};
  const shape = schema.shape;

  Object.keys(shape).forEach((key) => {
    const fieldSchema = shape[key];
    rules[key] = [
      {
        validator: (value, cb) => {
          const result = fieldSchema.safeParse(value);
          if (!result.success) {
            const message = result.error.issues[0]?.message || '校验失败';
            cb(message);
          } else {
            cb();
          }
        },
      },
    ];
  });

  return rules as Record<keyof T, { validator: (value: unknown, cb: (error?: string) => void) => void }[]>;
}

function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const login = useAuthStore((s) => s.login);
  const rules = generateZodRules<LoginInput>(zLoginInput);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      return request.post<LoginOutput>('/auth/login', data);
    },
    onSuccess: (data) => {
          login(data.accessToken, data.user as unknown as User);
          navigate('/dashboard');
        },
  });

  const handleSubmit = (values: Record<string, unknown>) => {
    loginMutation.mutate(values as LoginInput);
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.titleWrapper}>
          <Title heading={3} className={styles.title}>
            人力智能排班薪资一体化中台
          </Title>
        </div>
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          initialValues={{ username: 'admin', password: '123456' }}
        >
          <FormItem
            label="用户名"
            field="username"
            rules={rules.username}
          >
            <Input placeholder="请输入用户名" size="large" />
          </FormItem>
          <FormItem
            label="密码"
            field="password"
            rules={rules.password}
          >
            <Input.Password placeholder="请输入密码" size="large" />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              htmlType="submit"
              long
              size="large"
              loading={loginMutation.isPending}
            >
              登录
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
