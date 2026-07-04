// 修改点：1. 移除 any 类型，使用泛型 T 2. 完善 Props 类型定义 3. 类型安全的表单值 4. labelCol 固定比例
import { Modal, Form, Button, Space } from '@arco-design/web-react';
import type { ReactNode } from 'react';
import { useImperativeHandle, forwardRef } from 'react';
import styles from './style.module.css';

export type BaseFormModalRef<T = Record<string, unknown>> = {
  getForm: () => ReturnType<typeof Form.useForm<T>>[0];
  submit: () => void;
};

type BaseFormModalProps<T> = {
  visible: boolean;
  title: string;
  onOk?: (values: T) => void;
  onCancel: () => void;
  okText?: string;
  cancelText?: string;
  loading?: boolean;
  children?: ReactNode;
  width?: number;
  initialValues?: T;
  labelCol?: { span: number; offset?: number };
  wrapperCol?: { span: number; offset?: number };
};

const BaseFormModal = forwardRef(function BaseFormModal<T extends Record<string, unknown>>(
    {
      visible,
      title,
      onOk,
      onCancel,
      okText = '确认',
      cancelText = '取消',
      loading = false,
      children,
      width = 640,
      initialValues,
      labelCol = { span: 6 },
      wrapperCol = { span: 18 },
    }: BaseFormModalProps<T>,
    ref: React.Ref<BaseFormModalRef<T>>
  ) {
    const [form] = Form.useForm<T>();

    useImperativeHandle(ref, () => ({
      getForm: () => form,
      submit: () => form.submit(),
    }));

    const handleSubmit = (values: T) => {
      onOk?.(values);
    };

    const handleOk = () => {
      form.submit();
    };

    return (
      <Modal
        visible={visible}
        title={title}
        onOk={handleOk}
        onCancel={onCancel}
        confirmLoading={loading}
        maskClosable={false}
        style={{ width }}
        okText={okText}
        cancelText={cancelText}
        footer={
          <Space size={8}>
            <Button onClick={onCancel}>{cancelText}</Button>
            <Button type="primary" loading={loading} onClick={handleOk}>
              {okText}
            </Button>
          </Space>
        }
        className={styles.modal}
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={labelCol}
          wrapperCol={wrapperCol}
          onSubmit={handleSubmit}
          initialValues={initialValues}
          className={styles.form}
        >
          {children}
        </Form>
      </Modal>
    );
  }
);

export default BaseFormModal;
