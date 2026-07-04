// 修改点：1. 修复 catch 块 err 隐式 any 类型 2. 添加文件顶部修改注释
import { Modal, Form, Input, Button, Space, Alert } from '@arco-design/web-react';
import { IconLock } from '@arco-design/web-react/icon';
import { useState, useEffect } from 'react';
import styles from './style.module.css';

const FormItem = Form.Item;

type BaseSalaryPwdModalProps = {
  visible: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<boolean> | boolean;
  title?: string;
  maxAttempts?: number;
  lockDuration?: number;
};

function BaseSalaryPwdModal({
  visible,
  onClose,
  onVerify,
  title = '请输入二级密码',
  maxAttempts = 3,
  lockDuration = 30 * 60 * 1000,
}: BaseSalaryPwdModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setErrorMsg('');
    }
  }, [visible, form]);

  useEffect(() => {
    if (!isLocked) return;

    const endTime = Date.now() + lockDuration;
    const timer = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setLockRemaining(remaining);
      if (remaining <= 0) {
        setIsLocked(false);
        setErrorCount(0);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockDuration]);

  const formatLockTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  const handleSubmit = async (values: { password: string }) => {
    if (isLocked) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await onVerify(values.password);
      if (result) {
        setErrorCount(0);
        onClose();
      } else {
        const newCount = errorCount + 1;
        setErrorCount(newCount);
        setErrorMsg('密码错误，请重试');

        if (newCount >= maxAttempts) {
          setIsLocked(true);
          setLockRemaining(lockDuration);
          setErrorMsg(`错误次数过多，账号已锁定`);
        }
      }
    } catch (err: unknown) {
      setErrorMsg('验证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const remainingAttempts = maxAttempts - errorCount;

  return (
    <Modal
      visible={visible}
      title={title}
      onCancel={onClose}
      maskClosable={false}
      style={{ width: 480 }}
      footer={
        <Space size={8}>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={loading}
            disabled={isLocked}
            onClick={() => form.submit()}
          >
            确认
          </Button>
        </Space>
      }
      className={styles.modal}
    >
      <Form
        form={form}
        layout="vertical"
        onSubmit={handleSubmit}
        className={styles.form}
      >
        <div className={styles.iconWrapper}>
          <IconLock className={styles.lockIcon} />
        </div>

        {isLocked && (
          <Alert
            type="warning"
            showIcon
            content={`账号已锁定，请 ${formatLockTime(lockRemaining)} 后重试`}
            className={styles.alert}
          />
        )}

        {!isLocked && errorCount > 0 && (
          <Alert
            type="error"
            showIcon
            content={`${errorMsg}，剩余尝试 ${remainingAttempts} 次`}
            className={styles.alert}
          />
        )}

        <FormItem
          field="password"
          rules={[{ required: true, message: '请输入二级密码' }]}
          className={styles.passwordItem}
        >
          <Input.Password
            placeholder="请输入二级密码"
            size="large"
            disabled={isLocked || loading}
            autoFocus
          />
        </FormItem>

        {!isLocked && (
          <p className={styles.tip}>
            为保障薪资数据安全，请输入二级密码进行身份验证
          </p>
        )}
      </Form>
    </Modal>
  );
}

export default BaseSalaryPwdModal;
