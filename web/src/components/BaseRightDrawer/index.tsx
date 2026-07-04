// 修改点：1. maskClosable 默认值改为 false（与 Modal 规范一致） 2. 添加文件顶部修改注释
import { Drawer, Button, Space } from '@arco-design/web-react';
import type { ReactNode } from 'react';
import styles from './style.module.css';

type BaseRightDrawerProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onOk?: () => void;
  okText?: string;
  cancelText?: string;
  loading?: boolean;
  children?: ReactNode;
  width?: number | string;
  footer?: ReactNode;
  maskClosable?: boolean;
};

function BaseRightDrawer({
  visible,
  title,
  onClose,
  onOk,
  okText = '确认',
  cancelText = '取消',
  loading = false,
  children,
  width = 600,
  footer,
  maskClosable = false,
}: BaseRightDrawerProps) {
  const defaultFooter = (
    <div className={styles.footer}>
      <Space size={8}>
        <Button onClick={onClose}>{cancelText}</Button>
        {onOk && (
          <Button type="primary" loading={loading} onClick={onOk}>
            {okText}
          </Button>
        )}
      </Space>
    </div>
  );

  return (
    <Drawer
      width={width}
      title={title}
      visible={visible}
      onCancel={onClose}
      maskClosable={maskClosable}
      footer={footer !== undefined ? footer : defaultFooter}
      className={styles.drawer}
    >
      <div className={styles.content}>{children}</div>
    </Drawer>
  );
}

export default BaseRightDrawer;
