/*
 * 修改点：
 * 1. 移除 Form.Item 的 schema prop（Arco Form 不支持）
 * 2. 移除未使用的 form prop
 * 3. 内联 style → CSS module
 * 4. zod schema 改为仅用 rules 验证
 */
import { Form, Input, Space } from '@arco-design/web-react';
import styles from './ShiftTemplateForm.module.css';

type Props = {
  isEdit?: boolean;
};

function ShiftTemplateForm({ isEdit: _isEdit = false }: Props) {
  return (
    <Space direction="vertical" size={16} className={styles.formWrap}>
      <Form.Item
        field="name"
        label="班次名称"
        rules={[{ required: true, message: '请输入班次名称' }]}
      >
        <Input placeholder="请输入班次名称" maxLength={50} />
      </Form.Item>

      <Space direction="horizontal" size={16} className={styles.fullWidth}>
        <Form.Item
          field="startTime"
          label="开始时间"
          rules={[{ required: true, message: '请输入开始时间' }]}
          className={styles.flexItem}
        >
          <Input placeholder="09:00" maxLength={5} />
        </Form.Item>

        <Form.Item
          field="endTime"
          label="结束时间"
          rules={[{ required: true, message: '请输入结束时间' }]}
          className={styles.flexItem}
        >
          <Input placeholder="18:00" maxLength={5} />
        </Form.Item>
      </Space>

      <Form.Item
        field="color"
        label="颜色标识"
        rules={[{ required: true, message: '请输入颜色标识' }]}
      >
        <Input placeholder="#3B82F6" />
      </Form.Item>

      <Form.Item field="description" label="备注">
        <Input.TextArea placeholder="请输入备注信息" maxLength={500} rows={3} />
      </Form.Item>
    </Space>
  );
}

export default ShiftTemplateForm;
